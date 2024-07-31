use std::io::{Read, Seek};
use std::{
    fmt::Debug,
    io::Write,
    ops::Bound,
    sync::{atomic::AtomicU64, Arc},
    time::Duration,
};

use futures::lock::Mutex;
use http_range_client::HttpReader;
use segmap::{Segment, SegmentSet};
use symphonia::core::io::MediaSource;
use tempfile::NamedTempFile;
use tokio::task::JoinHandle;
use tracing::*;

use crate::HTTP_SESSION;
trait ReadAndSeek: Read + Seek + Send + Sync {}

pub struct NetworkAudioSource {
    url: String,
    byte_len: Option<u64>,
    cur_pos: Arc<AtomicU64>,
    tmp_file: NamedTempFile,
    available_ranges: Arc<Mutex<SegmentSet<u64>>>,
    io_error: Arc<Mutex<Option<std::io::Error>>>,
    http_task: Option<JoinHandle<()>>,
}

impl Debug for NetworkAudioSource {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("NetworkAudioSource")
            .field("url", &self.url)
            .finish()
    }
}

impl ReadAndSeek for std::io::BufReader<HttpReader> {}

impl NetworkAudioSource {
    #[instrument(skip_all)]
    pub async fn new(url: &str, song_size: Option<u64>) -> Result<Self, anyhow::Error> {
        let byte_len = HTTP_SESSION
            .head(url)
            .send()
            .await?
            .headers()
            .get("Content-Length")
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.parse::<u64>().ok())
            .or(song_size);

        info!("已创建网络音频源");
        info!("  链接: {url}");
        info!("  预估音频文件大小: {byte_len:?}");
        let tmp_file = NamedTempFile::new()?;
        let mut result = Self {
            url: url.to_owned(),
            byte_len,
            cur_pos: Arc::new(AtomicU64::new(0)),
            available_ranges: Arc::new(Mutex::new(SegmentSet::new())),
            tmp_file,
            io_error: Arc::new(Mutex::new(None)),
            http_task: None,
        };
        result.recreate_http_task(..);

        Ok(result)
    }

    fn recreate_http_task(&mut self, range: impl std::ops::RangeBounds<u64> + Debug) {
        let start = match range.start_bound() {
            Bound::Included(start) => *start,
            Bound::Excluded(start) => *start,
            Bound::Unbounded => 0,
        };
        let end = match range.end_bound() {
            Bound::Included(end) => Some(*end),
            Bound::Excluded(end) => Some(*end),
            Bound::Unbounded => self.byte_len,
        };
        let handle = tokio::runtime::Handle::current();
        let uri = self.url.clone();
        let tmp_file = self.tmp_file.reopen();
        let a_cur_pos = self.cur_pos.clone();
        let io_error = self.io_error.clone();
        let available_ranges = self.available_ranges.clone();
        let task = handle.spawn(async move {
            let mut cur_pos = start;
            let mut retry_times = 0;

            if let Err(err) = async move {
                let mut tmp_file = tmp_file?;
                tmp_file.seek(std::io::SeekFrom::Start(cur_pos))?;
                while cur_pos < end.unwrap_or(u64::MAX) {
                    let mut res = HTTP_SESSION
                        .get(&uri)
                        .header(
                            "Range",
                            if let Some(end) = end {
                                format!(
                                    "bytes={}-{}",
                                    cur_pos.min(end.wrapping_sub(1)),
                                    cur_pos.wrapping_add(1024 * 1024).min(end.wrapping_sub(1))
                                )
                            } else {
                                format!("bytes={}-{}", cur_pos, cur_pos.wrapping_add(1024 * 1024))
                            },
                        )
                        .send()
                        .await?;

                    if !res.status().is_success() {
                        warn!("网络音频状态码返回了非成功值: {}", res.status());
                        warn!("正在尝试接收错误响应");
                        let res = res.text().await?;
                        warn!("错误响应: {res}");
                        retry_times += 1;
                        if retry_times > 5 {
                            anyhow::bail!("重试次数过多，放弃请求");
                        } else {
                            warn!("正在尝试重试请求，重试次数: {retry_times}");
                            continue;
                        }
                    }

                    let mut res_size = 0;

                    while let Some(chunk) = res.chunk().await? {
                        let n = chunk.len();
                        tmp_file.write_all(&chunk)?;
                        let mut available_ranges = available_ranges.lock().await;
                        available_ranges.insert(cur_pos..cur_pos + n as u64);
                        cur_pos += n as u64;
                        res_size += n as u64;
                        drop(available_ranges);
                    }

                    if res_size == 0 {
                        break;
                    }

                    while a_cur_pos
                        .load(std::sync::atomic::Ordering::SeqCst)
                        .wrapping_add(1024 * 1024 * 8)
                        < cur_pos
                    {
                        tokio::time::sleep(Duration::from_millis(250)).await;
                    }
                }
                Ok::<(), anyhow::Error>(())
            }
            .await
            {
                warn!("create_http_task error: {err}");
                io_error
                    .lock()
                    .await
                    .replace(std::io::Error::new(std::io::ErrorKind::Other, err));
            }
        });
        if let Some(task) = self.http_task.take() {
            task.abort();
        }
        self.http_task = Some(task);
    }

    fn max_len(&self) -> u64 {
        self.byte_len.unwrap_or(u64::MAX)
    }

    fn block_until_contains_with_range(&self, pos: u64) -> Option<Segment<u64>> {
        tauri::async_runtime::block_on(async {
            let range = {
                let available_ranges = self.available_ranges.lock().await;
                available_ranges.get_range_for(&pos).copied()
            };
            if let Some(range) = range {
                return Some(range);
            }
            tokio::time::sleep(Duration::from_millis(250)).await;
            let range = {
                let available_ranges = self.available_ranges.lock().await;
                available_ranges.get_range_for(&pos).copied()
            };
            range
        })
    }

    fn get_cur_pos(&self) -> u64 {
        self.cur_pos.load(std::sync::atomic::Ordering::SeqCst)
    }

    fn set_cur_pos(&self, pos: u64) {
        self.cur_pos.store(pos, std::sync::atomic::Ordering::SeqCst);
    }
}

impl Drop for NetworkAudioSource {
    fn drop(&mut self) {
        if let Some(task) = self.http_task.take() {
            task.abort();
        }
    }
}

impl Seek for NetworkAudioSource {
    #[instrument]
    fn seek(&mut self, pos: std::io::SeekFrom) -> std::io::Result<u64> {
        info!("正在索引到位置 {pos:?}");
        let max_len = self.max_len();
        let pos = match pos {
            std::io::SeekFrom::Start(pos) => pos,
            std::io::SeekFrom::End(pos) => max_len.wrapping_add_signed(pos),
            std::io::SeekFrom::Current(pos) => self.get_cur_pos().wrapping_add_signed(pos),
        }
        .clamp(0, max_len);
        self.set_cur_pos(pos);
        if pos >= max_len.wrapping_sub(1) {
            return Ok(pos);
        }
        let handle = tokio::runtime::Handle::current();
        if !handle.block_on(async { self.available_ranges.lock().await.contains(&pos) }) {
            self.recreate_http_task(pos.wrapping_sub(1024 * 1024)..);
        }
        match self
            .tmp_file
            .seek(std::io::SeekFrom::Start(self.get_cur_pos()))
        {
            Ok(pos) => {
                debug_assert!(pos == self.get_cur_pos());
                Ok(pos)
            }
            Err(e) => Err(e),
        }
    }
}

impl Read for NetworkAudioSource {
    #[instrument(skip_all)]
    fn read(&mut self, buf: &mut [u8]) -> std::io::Result<usize> {
        let max_len = self.max_len();
        let read_pos = self.get_cur_pos();
        let handle = tokio::runtime::Handle::current();
        if read_pos >= max_len {
            return Ok(0);
        }
        let io_error = self.io_error.clone();
        if let Some(err) = handle.block_on(async move { io_error.lock().await.take() }) {
            error!("网络音频读取出现错误 {err:?}");
            return Err(err);
        }
        loop {
            match self.block_until_contains_with_range(read_pos) {
                Some(seg) => {
                    let result = {
                        if let Some(end_value) = seg.end_value().copied() {
                            let read_len =
                                ((end_value.wrapping_sub(read_pos)) as usize).min(buf.len());
                            if let Some(byte_len) = self.byte_len {
                                if read_len == 0 && read_pos < byte_len - 1 {
                                    Err(std::io::Error::new(
                                        std::io::ErrorKind::WouldBlock,
                                        "still loading",
                                    ))
                                } else {
                                    self.tmp_file.read(&mut buf[..read_len])
                                }
                            } else {
                                self.tmp_file.read(&mut buf[..read_len])
                            }
                        } else {
                            self.tmp_file.read(buf)
                        }
                    };
                    if let Ok(read_len) = result {
                        self.set_cur_pos(read_pos.wrapping_add(read_len as u64));
                    }
                    return result;
                }
                None => {
                    // 因为 Symphonia 不支持 WouldBlock 非阻塞请求，故同步阻塞直到下载线程拥有数据为止
                    // 相关 Issue: https://github.com/pdeljanov/Symphonia/issues/27
                    handle.block_on(tokio::time::sleep(Duration::from_millis(250)));
                    continue;
                }
            }
        }
    }
}

impl MediaSource for NetworkAudioSource {
    fn is_seekable(&self) -> bool {
        true
    }

    fn byte_len(&self) -> Option<u64> {
        self.byte_len
    }
}

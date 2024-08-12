use std::{fmt::Debug, sync::Mutex};

use concat_string::concat_string;

use tokio::sync::mpsc::{UnboundedReceiver, UnboundedSender};

use tracing::*;

use self::audio_quality::AudioQuality;
use serde::*;

mod audio_quality;
mod fft_player;
mod output;
mod player;
mod resampler;

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
#[non_exhaustive]
pub enum SongData {
    #[serde(rename_all = "camelCase")]
    Local {
        file_path: String,
        orig_order: usize,
    },
    /// 自定义的歌曲数据，可以交由宿主程序注册的歌曲元数据处理器处理
    #[serde(rename_all = "camelCase")]
    Custom {
        id: String,
        song_json_data: String,
        orig_order: usize,
    },
}

trait SongSource {
    fn get_id(&self) -> String;
    async fn fetch_source(&self) -> std::result::Result<Vec<u8>, String> {
        Err("未实现".to_string())
    }
}

impl SongSource for () {
    fn get_id(&self) -> String {
        "".to_string()
    }
}

impl SongSource for SongData {
    fn get_id(&self) -> String {
        match self {
            SongData::Local { file_path, .. } => format!("local:{:x}", md5::compute(file_path)),
            SongData::Custom {
                id,
                ..
            } => concat_string!("custom:", id),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub enum AudioThreadMessage {
    #[serde(rename_all = "camelCase")]
    ResumeAudio {
        callback_id: String,
    },
    #[serde(rename_all = "camelCase")]
    PauseAudio {
        callback_id: String,
    },
    #[serde(rename_all = "camelCase")]
    ResumeOrPauseAudio {
        callback_id: String,
    },
    #[serde(rename_all = "camelCase")]
    SeekAudio {
        callback_id: String,
        position: f64,
    },
    #[serde(rename_all = "camelCase")]
    JumpToSong {
        callback_id: String,
        song_index: usize,
    },
    #[serde(rename_all = "camelCase")]
    PrevSong {
        callback_id: String,
    },
    #[serde(rename_all = "camelCase")]
    NextSong {
        callback_id: String,
    },
    #[serde(rename_all = "camelCase")]
    SetPlaylist {
        callback_id: String,
        songs: Vec<SongData>,
    },
    #[serde(rename_all = "camelCase")]
    SetCookie {
        callback_id: String,
        cookie: String,
    },
    #[serde(rename_all = "camelCase")]
    SetVolume {
        callback_id: String,
        volume: f64,
    },
    #[serde(rename_all = "camelCase")]
    SetVolumeRelative {
        callback_id: String,
        volume: f64,
    },
    #[serde(rename_all = "camelCase")]
    SetAudioOutput {
        callback_id: String,
        name: String,
    },
    SyncStatus,
}

pub type AudioPlayerEventSender = tokio::sync::mpsc::Sender<AudioThreadEventMessage<AudioThreadEvent>>;

impl AudioThreadMessage {
    pub fn ret(
        &self,
        sender: AudioPlayerEventSender,
        data: AudioThreadEvent,
    ) {
        let msg = AudioThreadEventMessage {
            callback_id: match self {
                AudioThreadMessage::ResumeAudio { callback_id } => callback_id,
                AudioThreadMessage::PauseAudio { callback_id } => callback_id,
                AudioThreadMessage::ResumeOrPauseAudio { callback_id } => callback_id,
                AudioThreadMessage::SeekAudio { callback_id, .. } => callback_id,
                AudioThreadMessage::JumpToSong { callback_id, .. } => callback_id,
                AudioThreadMessage::PrevSong { callback_id } => callback_id,
                AudioThreadMessage::NextSong { callback_id } => callback_id,
                AudioThreadMessage::SetPlaylist { callback_id, .. } => callback_id,
                AudioThreadMessage::SetCookie { callback_id, .. } => callback_id,
                AudioThreadMessage::SetVolume { callback_id, .. } => callback_id,
                AudioThreadMessage::SetVolumeRelative { callback_id, .. } => callback_id,
                AudioThreadMessage::SetAudioOutput { callback_id, .. } => callback_id,
                AudioThreadMessage::SyncStatus => "",
            }
            .to_string(),
            data,
        };

        let _ = sender.blocking_send(msg);
    }
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "type", content = "data")]
pub enum AudioThreadEvent {
    #[serde(rename_all = "camelCase")]
    PlayPosition { position: f64 },
    #[serde(rename_all = "camelCase")]
    LoadProgress { position: f64 },
    #[serde(rename_all = "camelCase")]
    LoadAudio {
        music_id: String,
        duration: f64,
        quality: AudioQuality,
    },
    #[serde(rename_all = "camelCase")]
    LoadingAudio { music_id: String },
    #[serde(rename_all = "camelCase")]
    SyncStatus {
        music_id: String,
        is_playing: bool,
        duration: f64,
        position: f64,
        volume: f64,
        load_position: f64,
        playlist: Vec<SongData>,
        playlist_inited: bool,
        quality: AudioQuality,
    },
    #[serde(rename_all = "camelCase")]
    PlayStatus { is_playing: bool },
    #[serde(rename_all = "camelCase")]
    SetDuration { duration: f64 },
    #[serde(rename_all = "camelCase")]
    LoadError { error: String },
    #[serde(rename_all = "camelCase")]
    VolumeChanged { volume: f64 },
    #[serde(rename = "fftData")]
    #[serde(rename_all = "camelCase")]
    FFTData { data: Vec<f32> },
}

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AudioThreadEventMessage<T> {
    callback_id: String,
    data: T,
}

static MSG_SENDER: Mutex<Option<UnboundedSender<AudioThreadMessage>>> = Mutex::new(None);

pub fn stop_audio_thread() {
    (*MSG_SENDER.lock().unwrap()) = None;
}

pub fn send_msg_to_audio_thread_inner(msg: AudioThreadMessage) -> std::result::Result<(), String> {
    let sx = MSG_SENDER.lock().map_err(|x| x.to_string())?;
    let sx = sx
        .as_ref()
        .ok_or_else(|| "线程消息通道未建立".to_string())?;
    sx.send(msg).map_err(|x| x.to_string())?;
    Ok(())
}

pub fn send_msg_to_audio_thread(msg: AudioThreadMessage) -> std::result::Result<(), String> {
    send_msg_to_audio_thread_inner(msg)
}

pub async fn audio_thread_main(mut rx: UnboundedReceiver<AudioThreadMessage>) {
    info!("后台播放线程已开始运行！");
    let output = output::create_audio_output_thread();
    let mut player = Box::new(player::AudioPlayer::new(output));

    while let Some(msg) = rx.recv().await {
        player.process_message(msg).await;
    }
    info!("后台播放线程已结束运行！");
}

pub async fn init_audio_thread() -> std::result::Result<(), String> {
    let mut sender = MSG_SENDER.lock().map_err(|x| x.to_string())?;
    if sender.is_none() {
        let (sx, rx) = tokio::sync::mpsc::unbounded_channel::<AudioThreadMessage>();
        let build = std::thread::Builder::new()
            .name("play-thread".into())
            .spawn(move || {
                let rt = tokio::runtime::Runtime::new().unwrap();
                rt.block_on(audio_thread_main(rx));
            });
        match build {
            Ok(_) => {
                (*sender) = Some(sx);
            }
            Err(e) => {
                return Err(e.to_string());
            }
        }
    } else {
        drop(sender);
        send_msg_to_audio_thread_inner(AudioThreadMessage::SyncStatus)?;
    }
    Ok(())
}

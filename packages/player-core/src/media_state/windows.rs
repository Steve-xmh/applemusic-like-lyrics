use std::{
    io::Write,
    sync::{
        atomic::{AtomicBool, AtomicU64},
        mpsc::RecvTimeoutError,
        Arc, Mutex,
    },
    time::Duration,
};

use tempfile::NamedTempFile;
use tokio::sync::mpsc::UnboundedReceiver;
use windows::{
    core::*,
    Foundation::*,
    Media::*,
    Storage::{StorageFile, Streams::RandomAccessStreamReference},
};
use Playback::MediaPlayerAudioDeviceType;

use super::MediaStateMessage;

#[derive(Debug)]
pub struct MediaStateManagerWindowsBackend {
    #[allow(dead_code)]
    mp: windows::Media::Playback::MediaPlayer,
    smtc: SystemMediaTransportControls,
    smtc_timeline_prop: SystemMediaTransportControlsTimelineProperties,
    smtc_updater: SystemMediaTransportControlsDisplayUpdater,
    cover_file: Mutex<NamedTempFile>,
    should_update_smtc: AtomicBool,
    cur_duration: Arc<AtomicU64>,
    cur_position: Arc<AtomicU64>,
    cur_playing: Arc<AtomicBool>,
    timeline_sx: std::sync::mpsc::Sender<()>,
}

impl super::MediaStateManagerBackend for MediaStateManagerWindowsBackend {
    fn new() -> anyhow::Result<(Self, UnboundedReceiver<MediaStateMessage>)> {
        let (sx, rx) = tokio::sync::mpsc::unbounded_channel();
        let mp = windows::Media::Playback::MediaPlayer::new()?;
        mp.CommandManager()?.SetIsEnabled(false)?;
        let smtc = mp.SystemMediaTransportControls()?;
        smtc.SetIsEnabled(true)?;
        smtc.SetIsPlayEnabled(true)?;
        smtc.SetIsPauseEnabled(true)?;
        smtc.SetIsNextEnabled(true)?;
        smtc.SetIsPreviousEnabled(true)?;
        {
            let sx = sx.clone();
            smtc.ButtonPressed(&TypedEventHandler::new(
                move |_, args: &Option<SystemMediaTransportControlsButtonPressedEventArgs>| {
                    if let Some(args) = args {
                        match args.Button()? {
                            SystemMediaTransportControlsButton::Play => {
                                let _ = sx.send(MediaStateMessage::Play);
                            }
                            SystemMediaTransportControlsButton::Pause => {
                                let _ = sx.send(MediaStateMessage::Pause);
                            }
                            SystemMediaTransportControlsButton::Next => {
                                let _ = sx.send(MediaStateMessage::Next);
                            }
                            SystemMediaTransportControlsButton::Previous => {
                                let _ = sx.send(MediaStateMessage::Previous);
                            }
                            _ => {}
                        }
                    }
                    Ok(())
                },
            ))?;
        }
        let cur_duration = Arc::new(AtomicU64::new(0));
        let cur_position = Arc::new(AtomicU64::new(0));
        let cur_playing = Arc::new(AtomicBool::new(false));

        let timeline_sx = {
            let cur_duration = Arc::clone(&cur_duration);
            let cur_position = Arc::clone(&cur_position);
            let cur_playing = Arc::clone(&cur_playing);
            let (sx, rx) = std::sync::mpsc::channel();
            let smtc = mp.SystemMediaTransportControls()?;
            std::thread::spawn(move || -> anyhow::Result<()> {
                while let Err(RecvTimeoutError::Timeout) = rx.recv_timeout(Duration::from_secs(1)) {
                    if cur_playing.load(std::sync::atomic::Ordering::Relaxed) {
                        smtc.SetPlaybackStatus(MediaPlaybackStatus::Playing)?;
                    } else {
                        smtc.SetPlaybackStatus(MediaPlaybackStatus::Paused)?;
                    }
                    let prop = SystemMediaTransportControlsTimelineProperties::new()?;
                    prop.SetStartTime(TimeSpan::from(Duration::ZERO))?;
                    prop.SetEndTime(TimeSpan::from(Duration::from_millis(
                        cur_duration.load(std::sync::atomic::Ordering::Relaxed),
                    )))?;
                    prop.SetPosition(TimeSpan::from(Duration::from_millis(
                        cur_position.load(std::sync::atomic::Ordering::Relaxed),
                    )))?;
                    prop.SetMinSeekTime(TimeSpan::from(Duration::ZERO))?;
                    prop.SetMaxSeekTime(TimeSpan::from(Duration::from_millis(
                        cur_duration.load(std::sync::atomic::Ordering::Relaxed),
                    )))?;
                    smtc.UpdateTimelineProperties(&prop)?;
                }
                Ok(())
            });
            sx
        };

        {
            let sx = sx.clone();
            let cur_duration_clone = Arc::clone(&cur_duration);
            let cur_position_clone = Arc::clone(&cur_position);
            smtc.PlaybackPositionChangeRequested(&TypedEventHandler::new(
                move |this: &Option<SystemMediaTransportControls>,
                      args: &Option<PlaybackPositionChangeRequestedEventArgs>| {
                    if let Some(this) = this {
                        if let Some(args) = args {
                            let pos: Duration = args.RequestedPlaybackPosition()?.into();
                            let duration = Duration::from_millis(
                                cur_duration_clone.load(std::sync::atomic::Ordering::Relaxed),
                            );
                            if pos > duration {
                                return Ok(());
                            }
                            cur_position_clone.store(
                                pos.as_millis() as u64,
                                std::sync::atomic::Ordering::Relaxed,
                            );
                            let _ = sx.send(MediaStateMessage::Seek(pos.as_secs_f64()));

                            let prop = SystemMediaTransportControlsTimelineProperties::new()?;
                            prop.SetStartTime(TimeSpan::from(Duration::ZERO))?;
                            prop.SetEndTime(TimeSpan::from(Duration::from_millis(
                                cur_duration_clone.load(std::sync::atomic::Ordering::Relaxed),
                            )))?;
                            prop.SetPosition(TimeSpan::from(Duration::from_millis(
                                cur_position_clone.load(std::sync::atomic::Ordering::Relaxed),
                            )))?;
                            prop.SetMinSeekTime(TimeSpan::from(Duration::ZERO))?;
                            prop.SetMaxSeekTime(TimeSpan::from(Duration::from_millis(
                                cur_duration_clone.load(std::sync::atomic::Ordering::Relaxed),
                            )))?;
                            this.UpdateTimelineProperties(&prop)?;
                        }
                    }

                    Ok(())
                },
            ))?;
        }
        let smtc_updater = smtc.DisplayUpdater()?;
        smtc_updater.SetAppMediaId(h!("AMLLPlayerCore"))?;
        smtc_updater.SetType(MediaPlaybackType::Music)?;
        mp.SetAudioDeviceType(MediaPlayerAudioDeviceType::Multimedia)?;
        let result = Self {
            mp,
            smtc,
            smtc_timeline_prop: SystemMediaTransportControlsTimelineProperties::new()?,
            smtc_updater,
            cover_file: Mutex::new(NamedTempFile::new()?),
            should_update_smtc: AtomicBool::new(false),
            cur_duration,
            cur_position,
            cur_playing,
            timeline_sx,
        };
        result
            .smtc_timeline_prop
            .SetStartTime(TimeSpan::from(Duration::ZERO))?;
        result
            .smtc_timeline_prop
            .SetMinSeekTime(TimeSpan::from(Duration::ZERO))?;
        result.set_position(0.0)?;
        result.set_duration(0.0)?;
        result.set_title("未知歌曲")?;
        result.set_artist("未知歌手")?;
        result.update()?;
        Ok((result, rx))
    }

    fn set_playing(&self, playing: bool) -> anyhow::Result<()> {
        self.cur_playing
            .store(playing, std::sync::atomic::Ordering::Relaxed);
        self.smtc.SetPlaybackStatus(if playing {
            MediaPlaybackStatus::Playing
        } else {
            MediaPlaybackStatus::Paused
        })?;
        Ok(())
    }

    fn set_title(&self, title: &str) -> anyhow::Result<()> {
        let title = HSTRING::from(title);
        self.smtc_updater.MusicProperties()?.SetTitle(&title)?;
        self.should_update_smtc
            .store(true, std::sync::atomic::Ordering::Relaxed);
        Ok(())
    }

    fn set_artist(&self, artist: &str) -> anyhow::Result<()> {
        let artist = HSTRING::from(artist);
        self.smtc_updater.MusicProperties()?.SetArtist(&artist)?;
        self.should_update_smtc
            .store(true, std::sync::atomic::Ordering::Relaxed);
        Ok(())
    }

    fn set_duration(&self, duration: f64) -> anyhow::Result<()> {
        self.cur_duration.store(
            (duration * 1000.0) as u64,
            std::sync::atomic::Ordering::Relaxed,
        );
        Ok(())
    }

    fn set_position(&self, position: f64) -> anyhow::Result<()> {
        self.cur_position.store(
            (position * 1000.0) as u64,
            std::sync::atomic::Ordering::Relaxed,
        );
        Ok(())
    }

    fn set_cover_image(&self, cover_data: impl AsRef<[u8]>) -> anyhow::Result<()> {
        let cover_data = cover_data.as_ref();
        if cover_data.is_empty() {
            self.smtc_updater.SetThumbnail(None)?;
            self.should_update_smtc
                .store(true, std::sync::atomic::Ordering::Relaxed);
            return Ok(());
        }

        let mut new_cover_file = NamedTempFile::new()?;
        new_cover_file.write_all(cover_data)?;
        let temp_file_path = new_cover_file.path();
        let temp_file_path = HSTRING::from(temp_file_path.to_str().unwrap());
        let storage_file = StorageFile::GetFileFromPathAsync(&temp_file_path)?.get()?;
        self.smtc_updater
            .SetThumbnail(&RandomAccessStreamReference::CreateFromFile(&storage_file)?)?;
        let mut cover_file = self.cover_file.lock().unwrap();
        *cover_file = new_cover_file;
        self.should_update_smtc
            .store(true, std::sync::atomic::Ordering::Relaxed);

        Ok(())
    }

    fn update(&self) -> anyhow::Result<()> {
        if self
            .should_update_smtc
            .swap(false, std::sync::atomic::Ordering::Relaxed)
        {
            self.smtc_updater.Update()?;
        }
        Ok(())
    }
}

impl Drop for MediaStateManagerWindowsBackend {
    fn drop(&mut self) {
        let _ = self.timeline_sx.send(());
    }
}

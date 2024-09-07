use std::{cell::Cell, ptr::NonNull, sync::RwLock};

use super::*;
use anyhow::Context;
use objc2::{rc::*, runtime::AnyObject, ClassType};
use objc2_app_kit::*;
use objc2_foundation::*;
use objc2_media_player::*;
use tokio::sync::mpsc::UnboundedSender;

// static NP_INFO_CTR_LOCK: Mutex<()> = Mutex::new(());

pub struct MediaStateManagerMacOSBackend {
    np_info_ctr: Id<MPNowPlayingInfoCenter>,
    cmd_ctr: Id<MPRemoteCommandCenter>,
    info: RwLock<Id<NSMutableDictionary<NSString, AnyObject>>>,
    playing: Cell<bool>,
    sender: UnboundedSender<MediaStateMessage>,
}

impl Debug for MediaStateManagerMacOSBackend {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("MediaStateManagerMacOSBackend")
            .field("np_info_ctr", &self.np_info_ctr)
            .field("info", &self.info)
            .field("playing", &self.playing)
            .finish()
    }
}

unsafe impl Send for MediaStateManagerMacOSBackend {}
unsafe impl Sync for MediaStateManagerMacOSBackend {}

impl MediaStateManagerBackend for MediaStateManagerMacOSBackend {
    fn new() -> anyhow::Result<(Self, UnboundedReceiver<MediaStateMessage>)> {
        let (sender, receiver) = tokio::sync::mpsc::unbounded_channel();
        let np_info_ctr = unsafe { MPNowPlayingInfoCenter::defaultCenter() };
        let cmd_ctr = unsafe { MPRemoteCommandCenter::sharedCommandCenter() };
        let mut dict: Id<NSMutableDictionary<NSString, AnyObject>> = NSMutableDictionary::new();
        unsafe {
            dict.setValue_forKey(
                Some(&NSNumber::new_usize(MPMediaType::Music.0)),
                MPMediaItemPropertyMediaType,
            );
        }
        // TODO: 实现 Drop 以回收这些资源
        {
            let sender_clone = sender.clone();
            let req_handler = block2::RcBlock::new(
                move |_: NonNull<MPRemoteCommandEvent>| -> MPRemoteCommandHandlerStatus {
                    let _ = sender_clone.send(MediaStateMessage::Play);
                    MPRemoteCommandHandlerStatus::Success
                },
            );
            unsafe {
                cmd_ctr.playCommand().addTargetWithHandler(&req_handler);
            }
        }
        {
            let sender_clone = sender.clone();
            let req_handler = block2::RcBlock::new(
                move |_: NonNull<MPRemoteCommandEvent>| -> MPRemoteCommandHandlerStatus {
                    let _ = sender_clone.send(MediaStateMessage::Pause);
                    MPRemoteCommandHandlerStatus::Success
                },
            );
            unsafe {
                cmd_ctr.pauseCommand().addTargetWithHandler(&req_handler);
            }
        }
        {
            let sender_clone = sender.clone();
            let req_handler = block2::RcBlock::new(
                move |mut evt: NonNull<MPRemoteCommandEvent>| -> MPRemoteCommandHandlerStatus {
                    if let Some(evt) = unsafe { Id::retain(evt.as_mut()) } {
                        let evt: Id<MPChangePlaybackPositionCommandEvent> =
                            unsafe { Id::cast(evt) };
                        let pos = unsafe { evt.positionTime() };
                        let _ = sender_clone.send(MediaStateMessage::Seek(pos));
                    }
                    MPRemoteCommandHandlerStatus::Success
                },
            );
            unsafe {
                cmd_ctr
                    .changePlaybackPositionCommand()
                    .addTargetWithHandler(&req_handler);
            }
        }
        {
            let sender_clone = sender.clone();
            let req_handler = block2::RcBlock::new(
                move |_: NonNull<MPRemoteCommandEvent>| -> MPRemoteCommandHandlerStatus {
                    let _ = sender_clone.send(MediaStateMessage::PlayOrPause);
                    MPRemoteCommandHandlerStatus::Success
                },
            );
            unsafe {
                cmd_ctr
                    .togglePlayPauseCommand()
                    .addTargetWithHandler(&req_handler);
            }
        }
        {
            let sender_clone = sender.clone();
            let req_handler = block2::RcBlock::new(
                move |_: NonNull<MPRemoteCommandEvent>| -> MPRemoteCommandHandlerStatus {
                    let _ = sender_clone.send(MediaStateMessage::Previous);
                    MPRemoteCommandHandlerStatus::Success
                },
            );
            unsafe {
                cmd_ctr
                    .previousTrackCommand()
                    .addTargetWithHandler(&req_handler);
            }
        }
        {
            let sender_clone = sender.clone();
            let req_handler = block2::RcBlock::new(
                move |_: NonNull<MPRemoteCommandEvent>| -> MPRemoteCommandHandlerStatus {
                    let _ = sender_clone.send(MediaStateMessage::Next);
                    MPRemoteCommandHandlerStatus::Success
                },
            );
            unsafe {
                cmd_ctr
                    .nextTrackCommand()
                    .addTargetWithHandler(&req_handler);
            }
        }
        Ok((
            Self {
                np_info_ctr,
                cmd_ctr,
                info: RwLock::new(dict),
                playing: Cell::new(false),
                sender,
            },
            receiver,
        ))
    }

    fn set_playing(&self, playing: bool) -> anyhow::Result<()> {
        unsafe {
            self.np_info_ctr.setPlaybackState(if playing {
                MPNowPlayingPlaybackState::Playing
            } else {
                MPNowPlayingPlaybackState::Paused
            });
        }
        Ok(())
    }

    fn set_title(&self, title: &str) -> anyhow::Result<()> {
        let mut info = self.info.write().unwrap();
        unsafe {
            info.setValue_forKey(Some(&NSString::from_str(title)), MPMediaItemPropertyTitle);
        }
        Ok(())
    }

    fn set_artist(&self, artist: &str) -> anyhow::Result<()> {
        let mut info = self.info.write().unwrap();
        unsafe {
            info.setValue_forKey(Some(&NSString::from_str(artist)), MPMediaItemPropertyArtist);
        }
        Ok(())
    }

    fn set_duration(&self, duration: f64) -> anyhow::Result<()> {
        let mut info = self.info.write().unwrap();
        unsafe {
            info.setValue_forKey(
                Some(&NSNumber::new_f64(duration)),
                MPMediaItemPropertyPlaybackDuration,
            );
        }
        Ok(())
    }

    fn set_position(&self, position: f64) -> anyhow::Result<()> {
        let mut info = self.info.write().unwrap();
        unsafe {
            info.setValue_forKey(
                Some(&NSNumber::new_f64(position)),
                MPNowPlayingInfoPropertyElapsedPlaybackTime,
            );
        }
        Ok(())
    }

    fn set_cover_image(&self, cover_data: impl AsRef<[u8]>) -> anyhow::Result<()> {
        let cover_data = cover_data.as_ref();
        if cover_data.is_empty() {
            let mut info = self.info.write().unwrap();
            unsafe {
                info.setValue_forKey(None, MPMediaItemPropertyArtwork);
            }
            return Ok(());
        }
        let cover_data = cover_data.to_vec();
        let cover_data = NSData::from_vec(cover_data);
        let img = NSImage::alloc();
        let img = NSImage::initWithData(img, &cover_data).context("initWithData")?;
        let img_size = unsafe { img.size() };
        let img = NonNull::new(Id::into_raw(img)).unwrap();
        let artwork = MPMediaItemArtwork::alloc();
        let req_handler = block2::RcBlock::new(move |_: CGSize| img);
        let artwork = unsafe {
            MPMediaItemArtwork::initWithBoundsSize_requestHandler(artwork, img_size, &req_handler)
        };
        let mut info = self.info.write().unwrap();
        unsafe {
            info.setValue_forKey(Some(&artwork), MPMediaItemPropertyArtwork);
        }
        Ok(())
    }

    fn update(&self) -> anyhow::Result<()> {
        let np_info = self.info.read().unwrap();
        let np_info = np_info.copy();
        unsafe {
            self.np_info_ctr.setNowPlayingInfo(Some(&np_info));
        }
        Ok(())
    }
}

use std::{cell::Cell, sync::RwLock};

use super::*;
use anyhow::Context;
use objc2::{rc::*, runtime::AnyObject, ClassType};
use objc2_app_kit::*;
use objc2_foundation::*;
use objc2_media_player::*;
use tokio::sync::mpsc::UnboundedSender;

// static NP_INFO_CTR_LOCK: Mutex<()> = Mutex::new(());

#[derive(Debug)]
pub struct MediaStateManagerMacOSBackend {
    np_info_ctr: Id<MPNowPlayingInfoCenter>,
    info: RwLock<Id<NSMutableDictionary<NSString, AnyObject>>>,
    playing: Cell<bool>,
    sender: UnboundedSender<MediaStateMessage>,
}

unsafe impl Send for MediaStateManagerMacOSBackend {}
unsafe impl Sync for MediaStateManagerMacOSBackend {}

impl MediaStateManagerBackend for MediaStateManagerMacOSBackend {
    fn new() -> anyhow::Result<(Self, UnboundedReceiver<MediaStateMessage>)> {
        let (sender, receiver) = tokio::sync::mpsc::unbounded_channel();
        let np_info_ctr = unsafe { MPNowPlayingInfoCenter::defaultCenter() };
        let mut dict: Id<NSMutableDictionary<NSString, AnyObject>> = NSMutableDictionary::new();
        unsafe {
            dict.setValue_forKey(
                Some(&NSNumber::new_usize(MPMediaType::Music.0)),
                MPMediaItemPropertyMediaType,
            );
        }
        Ok((
            Self {
                np_info_ctr,
                info: RwLock::new(dict),
                playing: Cell::new(false),
                sender,
            },
            receiver,
        ))
    }

    fn set_playing(&self, playing: bool) -> anyhow::Result<()> {
        self.playing.set(dbg!(playing));
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
        let cover_data = cover_data.as_ref().to_vec();
        let cover_data = NSData::from_vec(cover_data);
        let img = NSImage::alloc();
        let img = NSImage::initWithData(img, &cover_data).context("initWithData")?;
        let mut info = self.info.write().unwrap();
        unsafe {
            info.setValue_forKey(Some(&img), MPMediaItemPropertyArtwork);
        }
        Ok(())
    }

    fn update(&self) -> anyhow::Result<()> {
        let np_info = self.info.read().unwrap();
        let np_info = np_info.copy();
        unsafe {
            self.np_info_ctr.setNowPlayingInfo(Some(&np_info));
            self.np_info_ctr.setPlaybackState(if self.playing.get() {
                MPNowPlayingPlaybackState::Playing
            } else {
                MPNowPlayingPlaybackState::Paused
            });
        }
        Ok(())
    }
}

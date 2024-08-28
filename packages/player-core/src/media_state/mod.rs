use std::fmt::Debug;

use tokio::sync::mpsc::UnboundedReceiver;

#[cfg(target_os = "windows")]
mod windows;

pub enum MediaStateMessage {
    Play,
    Pause,
    Next,
    Previous,
}

pub(super) trait MediaStateManagerBackend: Sized + Debug {
    fn new() -> anyhow::Result<(Self, UnboundedReceiver<MediaStateMessage>)>;
    fn set_playing(&self, playing: bool) -> anyhow::Result<()>;
    fn set_title(&self, title: &str) -> anyhow::Result<()>;
    fn set_artist(&self, artist: &str) -> anyhow::Result<()>;
    fn set_cover_image(&self, cover_data: impl AsRef<[u8]>) -> anyhow::Result<()>;
    fn update(&self) -> anyhow::Result<()>;
}

#[derive(Debug)]
pub struct EmptyMediaStateManager;

impl MediaStateManagerBackend for EmptyMediaStateManager {
    fn new() -> anyhow::Result<(Self, UnboundedReceiver<MediaStateMessage>)> {
        Ok((Self, tokio::sync::mpsc::unbounded_channel().1))
    }

    fn set_playing(&self, _playing: bool) -> anyhow::Result<()> {
        Ok(())
    }

    fn set_title(&self, _title: &str) -> anyhow::Result<()> {
        Ok(())
    }

    fn set_artist(&self, _artist: &str) -> anyhow::Result<()> {
        Ok(())
    }

    fn set_cover_image(&self, _cover_data: impl AsRef<[u8]>) -> anyhow::Result<()> {
        Ok(())
    }

    fn update(&self) -> anyhow::Result<()> {
        Ok(())
    }
}

#[cfg(target_os = "windows")]
pub type MediaStateManager = windows::MediaStateManagerWindowsBackend;
#[cfg(not(target_os = "windows"))]
pub type MediaStateManager = EmptyMediaStateManager;

use std::time::Duration;

use tokio::sync::mpsc::UnboundedReceiver;
use windows::{
    core::*,
    Foundation::*,
    Media::*,
    Storage::Streams::{Buffer, InMemoryRandomAccessStream, RandomAccessStreamReference},
    Win32::System::WinRT::IMemoryBufferByteAccess,
};
use Playback::MediaPlayerAudioDeviceType;

use super::MediaStateMessage;

#[derive(Debug)]
pub struct MediaStateManagerWindowsBackend {
    mp: windows::Media::Playback::MediaPlayer,
    smtc: SystemMediaTransportControls,
    smtc_timeline_prop: SystemMediaTransportControlsTimelineProperties,
    smtc_updater: SystemMediaTransportControlsDisplayUpdater,
}

unsafe fn as_mut_slice(buffer: &IMemoryBufferReference) -> anyhow::Result<&mut [u8]> {
    let interop = buffer.cast::<IMemoryBufferByteAccess>()?;
    let mut data = std::ptr::null_mut();
    let mut len = 0;

    interop.GetBuffer(&mut data, &mut len)?;
    Ok(std::slice::from_raw_parts_mut(data, len as usize))
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
        let smtc_updater = smtc.DisplayUpdater()?;
        smtc_updater.SetAppMediaId(h!("AMLLPlayerCore"))?;
        smtc_updater.SetType(MediaPlaybackType::Music)?;
        let result = Self {
            mp,
            smtc,
            smtc_timeline_prop: SystemMediaTransportControlsTimelineProperties::new()?,
            smtc_updater,
        };
        result
            .smtc_timeline_prop
            .SetStartTime(TimeSpan::default())?;
        result
            .smtc_timeline_prop
            .SetMinSeekTime(TimeSpan::default())?;
        result.set_position(0.0)?;
        result.set_duration(0.0)?;
        result.set_title("未知歌曲")?;
        result.set_artist("未知歌手")?;
        result.update()?;
        Ok((result, rx))
    }

    fn set_playing(&self, playing: bool) -> anyhow::Result<()> {
        self.mp
            .SetAudioDeviceType(MediaPlayerAudioDeviceType::Multimedia)?;
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
        Ok(())
    }

    fn set_artist(&self, artist: &str) -> anyhow::Result<()> {
        let artist = HSTRING::from(artist);
        self.smtc_updater.MusicProperties()?.SetArtist(&artist)?;
        Ok(())
    }

    fn set_duration(&self, duration: f64) -> anyhow::Result<()> {
        // TODO: 无法工作
        let ts = TimeSpan::from(Duration::from_secs_f64(duration));
        self.smtc_timeline_prop.SetEndTime(ts)?;
        self.smtc_timeline_prop.SetMaxSeekTime(ts)?;
        self.smtc
            .UpdateTimelineProperties(&self.smtc_timeline_prop)?;
        Ok(())
    }

    fn set_position(&self, position: f64) -> anyhow::Result<()> {
        // TODO: 无法工作
        let ts = TimeSpan::from(Duration::from_secs_f64(position));
        self.smtc_timeline_prop.SetPosition(ts)?;
        self.smtc
            .UpdateTimelineProperties(&self.smtc_timeline_prop)?;
        Ok(())
    }

    fn set_cover_image(&self, cover_data: impl AsRef<[u8]>) -> anyhow::Result<()> {
        // TODO: 暂时无法显示出来，要确认原因
        // 而且下面写的在某些电脑上会崩溃

        // let cover_data = cover_data.as_ref();
        // let buf = MemoryBuffer::Create(cover_data.len() as _)?;
        // let reference = buf.CreateReference()?;
        // assert_eq!(reference.Capacity()?, cover_data.len() as _);

        // {
        //     let slice = unsafe { as_mut_slice(&reference)? };
        //     slice.copy_from_slice(cover_data);
        // }

        // let buf = Buffer::CreateCopyFromMemoryBuffer(&buf)?;

        // let stream = InMemoryRandomAccessStream::new()?;
        // stream
        //     .GetOutputStreamAt(0)?
        //     .WriteAsync(&buf)?
        //     .GetResults()?;
        // self.smtc_updater
        //     .SetThumbnail(&RandomAccessStreamReference::CreateFromStream(&stream)?)?;

        Ok(())
    }

    fn update(&self) -> anyhow::Result<()> {
        self.smtc_updater.Update()?;
        Ok(())
    }
}

use std::{fmt::Debug, sync::Mutex};

use concat_string::concat_string;

use tokio::sync::mpsc::{UnboundedReceiver, UnboundedSender};

use tracing::*;

use tauri::Manager;

use self::audio_quality::AudioQuality;
use serde::*;

mod audio_quality;
mod fft_player;
mod network_audio;
mod output;
mod player;
mod resampler;

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
#[non_exhaustive]
pub enum SongData<T = ()> {
    #[serde(rename_all = "camelCase")]
    Local {
        file_path: String,
        orig_order: usize,
    },
    #[serde(rename_all = "camelCase")]
    Custom(T),
}

trait HasSongId {
    fn get_id(&self) -> String;
}

impl HasSongId for () {
    fn get_id(&self) -> String {
        "".to_string()
    }
}

impl<T: HasSongId> HasSongId for SongData<T> {
    fn get_id(&self) -> String {
        match self {
            SongData::Local { file_path, .. } => format!("local:{:x}", md5::compute(file_path)),
            SongData::Custom(x) => x.get_id(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub enum AudioThreadMessage<T = ()> {
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
        songs: Vec<SongData<T>>,
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

#[derive(serde::Serialize, serde::Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
#[serde(tag = "type", content = "data")]
pub enum AudioThreadEvent<T> {
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
        playlist: Vec<SongData<T>>,
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
    if let AudioThreadMessage::SetCookie { cookie, .. } = &msg {
        let url = "https://music.163.com".parse().unwrap();
        for pair in cookie.split(';') {
            HTTP_COOKIE_JAR.add_cookie_str(&concat_string!(pair, "; Domain=music.163.com"), &url);
        }
    }
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

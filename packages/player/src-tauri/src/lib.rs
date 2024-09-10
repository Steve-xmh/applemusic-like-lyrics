use crate::server::AMLLWebSocketServer;
use amll_player_core::AudioInfo;
use serde::*;
use std::{net::SocketAddr, path::Path, sync::Mutex};
use symphonia::core::io::{MediaSourceStream, MediaSourceStreamOptions};
use tauri::{AppHandle, Manager, Runtime, State};
use tauri_plugin_fs::OpenOptions;
use tracing::*;

mod player;
mod server;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn ws_reopen_connection(addr: &str, ws: State<Mutex<AMLLWebSocketServer>>) {
    ws.lock().unwrap().reopen(addr.to_string());
}

#[tauri::command]
fn ws_get_connections(ws: State<Mutex<AMLLWebSocketServer>>) -> Vec<SocketAddr> {
    ws.lock().unwrap().get_connections()
}

#[tauri::command]
fn ws_boardcast_message(ws: State<'_, Mutex<AMLLWebSocketServer>>, data: ws_protocol::Body) {
    let ws = ws.clone();
    tauri::async_runtime::block_on(ws.lock().unwrap().boardcast_message(data));
}

#[tauri::command]
fn restart_app<R: Runtime>(app: AppHandle<R>) {
    tauri::process::restart(&app.env())
}

#[derive(Default, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MusicInfo {
    pub name: String,
    pub artist: String,
    pub album: String,
    pub lyric: String,
    pub cover: Vec<u8>,
    pub duration: f64,
}

impl From<AudioInfo> for MusicInfo {
    fn from(v: AudioInfo) -> Self {
        Self {
            name: v.name,
            artist: v.artist,
            album: v.album,
            lyric: v.lyric,
            cover: v.cover.unwrap_or_default(),
            duration: v.duration,
        }
    }
}

#[tauri::command]
async fn read_local_music_metadata(
    file_path: String,
    fs: State<'_, tauri_plugin_fs::Fs<tauri::Wry>>,
) -> Result<MusicInfo, String> {
    let mut opt = OpenOptions::new();
    opt.read(true);
    let file = fs
        .open(Path::new(&file_path), opt)
        .map_err(|e| format!("文件打开失败 {e}"))?;
    let result = tokio::task::spawn_blocking(move || -> Result<MusicInfo, String> {
        let probe = symphonia::default::get_probe();
        let mut format_result = probe
            .format(
                &Default::default(),
                MediaSourceStream::new(Box::new(file), MediaSourceStreamOptions::default()),
                &Default::default(),
                &Default::default(),
            )
            .map_err(|e| e.to_string())?;

        Ok(amll_player_core::utils::read_audio_info(&mut format_result).into())
    })
    .await;

    match result {
        Ok(result) => result,
        Err(e) => Err(e.to_string()),
    }
}

fn init_logging() {
    #[cfg(not(debug_assertions))]
    {
        let log_file = std::fs::File::create("amll-player.log");
        if let Ok(log_file) = log_file {
            tracing_subscriber::fmt()
                .map_writer(move |_| log_file)
                .with_thread_names(true)
                .with_ansi(false)
                .with_timer(tracing_subscriber::fmt::time::uptime())
                .init();
        } else {
            tracing_subscriber::fmt()
                .with_thread_names(true)
                .with_timer(tracing_subscriber::fmt::time::uptime())
                .init();
        }
    }
    #[cfg(debug_assertions)]
    {
        tracing_subscriber::fmt()
            .with_env_filter("amll_player=trace,wry=info")
            .with_thread_names(true)
            .with_timer(tracing_subscriber::fmt::time::uptime())
            // .with(tracing_android::layer("amll-player").unwrap())
            .init();
    }
    std::panic::set_hook(Box::new(move |info| {
        error!("Fatal error occurred! AMLL Player will exit now.");
        error!("Error:");
        error!("{info:#?}");
    }));
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_logging();
    info!("AMLL Player is starting!");
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            ws_reopen_connection,
            ws_get_connections,
            ws_boardcast_message,
            player::local_player_send_msg,
            read_local_music_metadata,
            restart_app,
        ])
        .setup(|app| {
            player::init_local_player(app.handle().clone());
            app.manage(Mutex::new(AMLLWebSocketServer::new(app.handle().clone())));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

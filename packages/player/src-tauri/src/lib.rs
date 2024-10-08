use crate::server::AMLLWebSocketServer;
use amll_player_core::AudioInfo;
use serde::*;
use serde_json::Value;
use std::sync::RwLock;
use std::{net::SocketAddr, path::Path};
use symphonia::core::io::{MediaSourceStream, MediaSourceStreamOptions};
use tauri::{AppHandle, Manager, PhysicalSize, Runtime, Size, State, Theme, WebviewWindowBuilder};
use tauri_plugin_fs::OpenOptions;
use tracing::*;

mod client;
mod player;
mod server;

pub type AMLLWebSocketServerWrapper = RwLock<AMLLWebSocketServer>;
pub type AMLLWebSocketServerState<'r> = State<'r, AMLLWebSocketServerWrapper>;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn ws_reopen_connection(addr: &str, ws: AMLLWebSocketServerState) {
    ws.write().unwrap().reopen(addr.to_string());
}

#[tauri::command]
fn ws_get_connections(ws: AMLLWebSocketServerState) -> Vec<SocketAddr> {
    ws.read().unwrap().get_connections()
}

#[tauri::command]
fn ws_boardcast_message(ws: AMLLWebSocketServerState, data: ws_protocol::Body) {
    let ws = ws.clone();
    tauri::async_runtime::block_on(ws.write().unwrap().boardcast_message(data));
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
    pub lyric_format: String,
    pub lyric: String,
    pub comment: String,
    pub cover: Vec<u8>,
    pub duration: f64,
}

impl From<AudioInfo> for MusicInfo {
    fn from(v: AudioInfo) -> Self {
        Self {
            name: v.name,
            artist: v.artist,
            album: v.album,
            lyric_format: if v.lyric.is_empty() {
                "".into()
            } else {
                "lrc".into()
            },
            lyric: v.lyric,
            comment: v.comment,
            cover: v.cover.unwrap_or_default(),
            duration: v.duration,
        }
    }
}

#[tauri::command]
async fn read_local_music_metadata(
    file_path: tauri_plugin_fs::FilePath,
    fs: State<'_, tauri_plugin_fs::Fs<tauri::Wry>>,
) -> Result<MusicInfo, String> {
    let mut opt = OpenOptions::new();
    opt.read(true);
    let file = fs
        .open(file_path.clone(), opt)
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

    const LYRIC_FILE_EXTENSIONS: &[&str] = &["ttml", "lys", "yrc", "qrc", "eslrc", "lrc"];

    match result {
        Ok(Ok(mut result)) => {
            if !result.lyric.is_empty() {
                result.lyric_format = "lrc".into();
            }
            if let Some(file_path) = file_path.as_path() {
                for ext in LYRIC_FILE_EXTENSIONS {
                    let lyric_file_path = file_path.with_extension(ext);
                    if lyric_file_path.exists() {
                        if let Ok(lyric) = fs.read_to_string(&lyric_file_path) {
                            result.lyric_format = ext.to_string();
                            result.lyric = lyric;
                            break;
                        } else {
                            warn!("歌词文件存在但读取失败: {}", lyric_file_path.display());
                        }
                    }
                }
            }
            Ok(result)
        }
        Ok(Err(e)) => Err(e),
        Err(e) => Err(e.to_string()),
    }
}

fn recreate_window(app: &AppHandle) {
    if let Some(win) = app.get_webview_window("main") {
        #[cfg(desktop)]
        {
            let _ = win.show();
            let _ = win.set_focus();
        }
        return;
    }
    #[cfg(debug_assertions)]
    let url = tauri::WebviewUrl::External(app.config().build.dev_url.clone().unwrap());
    #[cfg(not(debug_assertions))]
    let url = tauri::WebviewUrl::App("index.html".into());
    let win: WebviewWindowBuilder<'_, _, _> = WebviewWindowBuilder::new(app, "main", url);
    #[cfg(not(desktop))]
    let win = win;

    #[cfg(desktop)]
    let win = win
        .center()
        .inner_size(800.0, 600.0)
        .title({
            #[cfg(target_os = "macos")]
            {
                ""
            }
            #[cfg(not(target_os = "macos"))]
            {
                "AMLL Player"
            }
        })
        .visible(false)
        .theme(Some(Theme::Dark))
        .decorations({
            #[cfg(target_os = "macos")]
            {
                true
            }
            #[cfg(not(target_os = "macos"))]
            {
                false
            }
        });

    #[cfg(target_os = "macos")]
    let win = win.title_bar_style(tauri::TitleBarStyle::Overlay);

    let win = win.build().expect("can't show original window");

    #[cfg(desktop)]
    {
        let _ = win.show();
        let _ = win.set_focus();
        if let Ok(orig_size) = win.inner_size() {
            let _ = win.set_size(Size::Physical(PhysicalSize::new(0, 0)));
            let _ = win.set_size(orig_size);
        }
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
    #[allow(unused_mut)]
    let mut context = tauri::generate_context!();

    let builder = tauri::Builder::default();

    #[cfg(not(mobile))]
    let pubkey = {
        if let Some(Value::Object(updater_config)) = context.config().plugins.0.get("updater") {
            if let Some(Value::String(pubkey)) = updater_config.get("pubkey") {
                pubkey.clone()
            } else {
                "".into()
            }
        } else {
            "".into()
        }
    };
    #[cfg(not(mobile))]
    let builder = builder.plugin(tauri_plugin_updater::Builder::new().pubkey(pubkey).build());

    #[cfg(mobile)]
    {
        context
            .config_mut()
            .app
            .windows
            .push(tauri::utils::config::WindowConfig {
                ..Default::default()
            })
    }

    builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
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
            app.manage::<AMLLWebSocketServerWrapper>(RwLock::new(AMLLWebSocketServer::new(
                app.handle().clone(),
            )));
            #[cfg(not(mobile))]
            recreate_window(app.handle());
            Ok(())
        })
        .run(context)
        .expect("error while running tauri application");
}

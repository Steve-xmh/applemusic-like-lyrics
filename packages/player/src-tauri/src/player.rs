use amll_player_core::*;
use async_std::sync::RwLock;
use tauri::{Emitter, Manager, Runtime};

static PLAYER_HANDLER: RwLock<Option<AudioPlayerHandle>> = RwLock::new(None);

#[tauri::command]
pub async fn local_player_send_msg(msg: AudioThreadEventMessage<AudioThreadMessage>) {
    if let Some(handler) = &*PLAYER_HANDLER.read().await {
        let _ = handler.send(msg).await;
    }
}

async fn local_player_main<R: Runtime>(emitter: impl Manager<R> + Send + 'static) {
    let player = AudioPlayer::new();
    let handler = player.handler();
    PLAYER_HANDLER.write().await.replace(handler);

    player
        .run(move |evt| {
            for (_name, win) in emitter.webview_windows() {
                let _ = win.emit("audio_player_msg", evt.to_owned());
            }
        })
        .await;
}

pub fn init_local_player<R: Runtime>(emitter: impl Manager<R> + Send + 'static) {
    std::thread::spawn(|| {
        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(local_player_main(emitter));
    });
}

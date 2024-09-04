use amll_player_core::*;
use async_std::sync::RwLock;
use tauri::{Emitter, Runtime};
use tracing::info;

static PLAYER_HANDLER: RwLock<Option<AudioPlayerHandle>> = RwLock::new(None);

#[tauri::command]
pub async fn local_player_send_msg(msg: AudioThreadEventMessage<AudioThreadMessage>) {
    if let Some(handler) = &*PLAYER_HANDLER.read().await {
        let _ = handler.send(msg).await;
    }
}

async fn local_player_main<R: Runtime>(emitter: impl Emitter<R> + Send + 'static) {
    let player = AudioPlayer::new();
    let handler = player.handler();
    PLAYER_HANDLER.write().await.replace(handler);

    player
        .run(move |evt| {
            let _ = emitter.emit("audio_player_msg", evt);
        })
        .await;
}

pub fn init_local_player<R: Runtime>(emitter: impl Emitter<R> + Send + 'static) {
    std::thread::spawn(|| {
        tokio::runtime::Runtime::new()
            .unwrap()
            .block_on(local_player_main(emitter));
    });
}

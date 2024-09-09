use amll_player_core::*;
use async_std::sync::RwLock;
use tauri::{Emitter, Runtime};
use tracing::warn;

static PLAYER_HANDLER: RwLock<Option<AudioPlayerHandle>> = RwLock::new(None);

#[tauri::command]
pub async fn local_player_send_msg(msg: AudioThreadEventMessage<AudioThreadMessage>) {
    if let Some(handler) = &*PLAYER_HANDLER.read().await {
        if let Err(err) = handler.send(msg).await {
            warn!("failed to send msg to local player: {:?}", err);
        }
    }
}

async fn local_player_main<R: Runtime>(emitter: impl Emitter<R> + Send + 'static) {
    let player = AudioPlayer::new();
    let handler = player.handler();
    PLAYER_HANDLER.write().await.replace(handler);

    player
        .run(move |evt| {
            if let Err(err) = emitter.emit("audio_player_msg", evt) {
                warn!("failed to emit audio_player_msg: {:?}", err);
            }
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

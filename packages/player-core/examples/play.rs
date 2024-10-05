// 一个简单的播放器示例，读取参数中的音频文件并播放
use amll_player_core::*;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt().init();
    let file_name = std::env::args().nth(1).expect("Usage: play <file>");
    let file_path = std::path::Path::new(&file_name);
    let file_path = if file_path.is_absolute() {
        file_path.to_path_buf()
    } else {
        std::env::current_dir().unwrap().join(file_path)
    };
    let file_path = file_path.to_str().unwrap();
    let file_path = file_path.to_string();

    let player = AudioPlayer::new(AudioPlayerConfig {});
    let handler = player.handler();

    handler
        .send_anonymous(AudioThreadMessage::SetPlaylist {
            songs: vec![SongData::Local {
                file_path,
                orig_order: 0,
            }],
        })
        .await?;

    handler.send_anonymous(AudioThreadMessage::NextSong).await?;

    player
        .run(move |evt| {
            if let Some(evt) = evt.data() {
                match evt {
                    AudioThreadEvent::PlayPosition { .. } => {
                        // 数据量太多就不输出了
                        // println!("{:?}", play_position);
                    }
                    AudioThreadEvent::FFTData { .. } => {
                        // 数据量太多就不输出了
                        // println!("{:?}", fft_data);
                    }
                    AudioThreadEvent::AudioPlayFinished { .. } => {
                        let handler = handler.clone();
                        tokio::spawn(async move {
                            let _ = handler.send_anonymous(AudioThreadMessage::Close).await;
                            println!("播放完成，结束播放");
                        });
                    }
                    other => {
                        println!("{:?}", other);
                    }
                }
            }
        })
        .await;

    Ok(())
}

mod renderer;
mod server;
mod window;
use std::time::Instant;

use skia_safe::{gpu::gl::FramebufferInfo, Color4f, Data, Font, MaskFilter, TextBlob, Typeface};
use tracing::*;
use ws_protocol::Body;

use crate::{renderer::Renderer, server::AMLLWebSocketServer, window::WindowEvent};

enum GlobalMessage {
    Body(Body),
    SetAlbumImageData(Vec<u8>),
}

fn main() {
    tracing_subscriber::fmt::fmt()
        .with_max_level(tracing::Level::DEBUG)
        .init();
    info!("AMLL Skia Player is starting!");

    let (win_sx, win_rx) = std::sync::mpsc::channel();
    let mut window = window::Window::new(win_rx);

    let (sx, rx) = async_std::channel::unbounded();
    let mut server = AMLLWebSocketServer::new(sx);
    std::thread::spawn(move || {
        server.reopen("0.0.0.0:11444");
    });
    std::thread::spawn(move || {
        while let Ok(body) = rx.recv_blocking() {
            match body {
                Body::SetMusicAlbumCoverImageURL { img_url } => {
                    let img_url = img_url.to_string();
                    let win_sx = win_sx.clone();
                    // TODO: 确保同步
                    std::thread::spawn(move || match attohttpc::get(img_url).send() {
                        Ok(res) => match res.bytes() {
                            Ok(data) => {
                                if let Err(err) = win_sx.send(GlobalMessage::SetAlbumImageData(data)) {
                                    warn!("Failed to send message to window: {}", err)
                                }
                            }
                            Err(err) => {
                                warn!("Failed to fetch album image: {}", err)
                            }
                        },
                        Err(err) => {
                            warn!("Failed to fetch album image: {}", err)
                        }
                    });
                }
                other => {
                    if let Err(err) = win_sx.send(GlobalMessage::Body(other)) {
                        warn!("Failed to send message to window: {}", err)
                    }
                }
            }
        }
    });
    let mut renderer = Renderer::new();

    window.run(|win, evt| match evt {
        WindowEvent::WindowRedraw => {
            let canvas = win.canvas();
            renderer.render(canvas);
        }
        WindowEvent::WindowResize(w, h) => {
            renderer.set_size(w as _, h as _);
        }
        WindowEvent::VSyncEnabled(enabled) => {
            renderer.set_vsync(enabled);
        }
        WindowEvent::UserEvent(msg) => match msg {
            GlobalMessage::Body(body) => match body {
                Body::SetLyric { data } => {
                    renderer.set_lyric_lines(data);
                }
                Body::OnPlayProgress { progress } => {
                    renderer.set_progress(progress);
                }
                _ => {}
            },
            GlobalMessage::SetAlbumImageData(data) => {
                renderer.set_album_image(data);
            }
            _ => {}
        },
        _ => {}
    });

    info!("Exiting!");

    std::process::exit(0);
}

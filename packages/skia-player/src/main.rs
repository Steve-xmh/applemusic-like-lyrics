mod renderer;
mod server;
mod window;
use std::time::Instant;

use skia_safe::{gpu::gl::FramebufferInfo, Color4f, Data, Font, MaskFilter, TextBlob, Typeface};
use tracing::*;
use ws_protocol::Body;

use crate::{renderer::Renderer, server::AMLLWebSocketServer, window::WindowEvent};

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
            win_sx.send(body);
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
        WindowEvent::UserEvent(body) => match body {
            Body::SetLyric { data } => {
                renderer.set_lyric_lines(data);
            }
            Body::OnPlayProgress { progress } => {
                renderer.set_progress(progress);
            }
            _ => {}
        },
        _ => {}
    });

    info!("Exiting!");

    std::process::exit(0);
}

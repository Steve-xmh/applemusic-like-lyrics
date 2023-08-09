use std::sync::Arc;
use std::time::Duration;

use async_std::net::{TcpListener, TcpStream};
use async_std::sync::Mutex;
use async_std::task::{block_on, JoinHandle};
use async_tungstenite::tungstenite::Message;
use async_tungstenite::WebSocketStream;
use futures::prelude::*;
use futures::stream::SplitSink;
use tauri::{AppHandle, Manager};

type Connections = Arc<Mutex<Vec<SplitSink<WebSocketStream<TcpStream>, Message>>>>;

pub struct AMLLWebSocketServer {
    app: AppHandle,
    server_handle: Option<JoinHandle<()>>,
    connections: Connections,
}

impl AMLLWebSocketServer {
    pub fn new(app: AppHandle) -> Self {
        Self {
            app,
            server_handle: None,
            connections: Arc::new(Mutex::new(Vec::with_capacity(8))),
        }
    }
    pub fn reopen(&mut self, addr: String) {
        block_on(async move {
            if let Some(task) = self.server_handle.take() {
                task.cancel().await;
            }
            let app = self.app.clone();
            let connections = self.connections.clone();
            self.server_handle = Some(async_std::task::spawn(async move {
                loop {
                    println!("正在开启 WebSocket 服务器到 {addr}");
                    let listener = TcpListener::bind(&addr).await;
                    if let Ok(listener) = listener {
                        println!("已开启 WebSocket 服务器到 {addr}");
                        while let Ok((stream, _)) = listener.accept().await {
                            async_std::task::spawn(Self::accept_conn(
                                stream,
                                app.clone(),
                                connections.clone(),
                            ));
                        }
                        break;
                    } else {
                        async_std::task::sleep(Duration::from_secs(1)).await;
                    }
                }
            }));
        });
    }

    async fn accept_conn(
        stream: TcpStream,
        app: AppHandle,
        conns: Connections,
    ) -> anyhow::Result<()> {
        let addr = stream.peer_addr()?;
        println!("已接受套接字连接: {addr}");

        let wss = async_tungstenite::accept_async(stream).await?;
        println!("已连接 WebSocket 客户端: {addr}");

        let (write, read) = wss.split();

        conns.lock().await.push(write);

        let mut read = read.try_filter(|x| future::ready(x.is_binary()));

        while let Some(Ok(data)) = read.next().await {
            if let Ok(body) = ws_protocol::parse_body(&data.into_data()) {
                app.emit_all("on-client-body", body)?;
            }
        }

        println!("已断开 WebSocket 客户端: {addr}");
        Ok(())
    }
}

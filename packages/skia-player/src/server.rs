use std::time::Duration;
use std::{collections::HashSet, net::SocketAddr, sync::Arc};

use async_std::sync::Mutex;
use async_std::task::{block_on, JoinHandle};
use async_std::{
    channel::Sender,
    net::{TcpListener, TcpStream},
};
use async_tungstenite::tungstenite::Message;
use async_tungstenite::WebSocketStream;
use futures::prelude::*;
use futures::stream::SplitSink;
use tracing::*;
use ws_protocol::Body;

type Connections = Arc<Mutex<Vec<SplitSink<WebSocketStream<TcpStream>, Message>>>>;
type ConnectionAddrs = Arc<std::sync::Mutex<HashSet<SocketAddr>>>;
pub struct AMLLWebSocketServer {
    sender: Sender<ws_protocol::Body>,
    server_handle: Option<JoinHandle<()>>,
    connections: Connections,
    connection_addrs: ConnectionAddrs,
}

impl AMLLWebSocketServer {
    pub fn new(sender: Sender<ws_protocol::Body>) -> Self {
        Self {
            sender,
            server_handle: None,
            connections: Arc::new(Mutex::new(Vec::with_capacity(8))),
            connection_addrs: Arc::new(std::sync::Mutex::new(HashSet::with_capacity(8))),
        }
    }
    pub fn reopen(&mut self, addr: impl AsRef<str>) {
        let addr = addr.as_ref().to_string();
        block_on(async move {
            if let Some(task) = self.server_handle.take() {
                task.cancel().await;
            }
            let app = self.sender.clone();
            let connections = self.connections.clone();
            let conn_addrs = self.connection_addrs.clone();
            self.server_handle = Some(async_std::task::spawn(async move {
                loop {
                    info!("正在开启 WebSocket 服务器到 {addr}");
                    let listener = TcpListener::bind(&addr).await;
                    match listener {
                        Ok(listener) => {
                            println!("已开启 WebSocket 服务器到 {addr}");
                            while let Ok((stream, _)) = listener.accept().await {
                                async_std::task::spawn(Self::accept_conn(
                                    stream,
                                    app.clone(),
                                    connections.clone(),
                                    conn_addrs.clone(),
                                ));
                            }
                            break;
                        }
                        Err(err) => {
                            warn!("WebSocket 服务器 {addr} 开启失败: {err:?}");
                        }
                    }
                    async_std::task::sleep(Duration::from_secs(1)).await;
                }
            }));
        });
    }

    pub fn get_connections(&self) -> Vec<SocketAddr> {
        let conns = self
            .connection_addrs
            .lock()
            .unwrap()
            .iter()
            .copied()
            .collect();
        conns
    }

    async fn accept_conn(
        stream: TcpStream,
        sender: Sender<ws_protocol::Body>,
        conns: Connections,
        conn_addrs: ConnectionAddrs,
    ) -> anyhow::Result<()> {
        let addr = stream.peer_addr()?;
        debug!("已接受套接字连接: {addr}");

        let wss = async_tungstenite::accept_async(stream).await?;
        info!("已连接 WebSocket 客户端: {addr}");
        // sender.emit_all("on-client-connected", addr)?;
        conn_addrs.lock().unwrap().insert(addr.to_owned());

        let (write, read) = wss.split();

        conns.lock().await.push(write);

        let mut read = read.try_filter(|x| future::ready(x.is_binary()));

        while let Some(Ok(data)) = read.next().await {
            match ws_protocol::parse_body(&data.into_data()) {
                Ok(body) => {
                    debug!("已接收 WebSocket 客户端 {addr} 的数据: {body:?}");
                    // sender.emit_all("on-client-body", body)?;
                    sender.send(body).await?;
                }
                Err(err) => {
                    warn!("解析来自 WebSocket 客户端 {addr} 的数据发生错误: {err:?}")
                }
            }
        }

        info!("已断开 WebSocket 客户端: {addr}");
        // sender.emit_all("on-client-disconnected", addr)?;
        conn_addrs.lock().unwrap().remove(&addr);
        Ok(())
    }
}

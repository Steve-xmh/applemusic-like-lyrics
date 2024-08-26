// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::server::AMLLWebSocketServer;
use std::{
    collections::HashSet,
    net::SocketAddr,
    sync::{Arc, Mutex},
};
use tauri::{Manager, State};
use tracing::*;

mod server;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn reopen_connection(addr: &str, ws: State<Mutex<AMLLWebSocketServer>>) {
    ws.lock().unwrap().reopen(addr.to_string());
}

#[tauri::command]
fn get_connections(ws: State<Mutex<AMLLWebSocketServer>>) -> Vec<SocketAddr> {
    ws.lock().unwrap().get_connections()
}

#[tauri::command]
fn boardcast_message(ws: State<'_, Mutex<AMLLWebSocketServer>>, data: ws_protocol::Body) {
    let ws = ws.clone();
    tauri::async_runtime::block_on(ws.lock().unwrap().boardcast_message(data));
}

fn init_logging() {
    #[cfg(not(debug_assertions))]
    {
        let log_file = std::fs::File::create("mrbncm.log");
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
            .with_env_filter("player=trace")
            .with_thread_names(true)
            .with_timer(tracing_subscriber::fmt::time::uptime())
            .init();
    }
    std::panic::set_hook(Box::new(move |info| {
        error!("Fatal error occurred! AMLL Player will exit now.");
        error!("Error:");
        error!("{info:#?}");
    }));
}

fn main() {
    init_logging();
    info!("AMLL Player is starting!");
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            reopen_connection,
            get_connections,
            boardcast_message
        ])
        .setup(|app| {
            app.manage(Mutex::new(AMLLWebSocketServer::new(app.handle())));
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::server::AMLLWebSocketServer;
use std::{
    collections::HashSet,
    net::SocketAddr,
    sync::{Arc, Mutex},
};
use tauri::{Manager, State};

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

fn main() {
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

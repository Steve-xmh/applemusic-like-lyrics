import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import * as wsp from "@applemusic-like-lyrics/ws-protocol";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import "./utils/player";

(window as any).wsp = wsp;

invoke("ws_reopen_connection", {
	addr: "",
});

invoke("ws_get_connections").then((v) => {
	console.log("当前已连接", v);
});

listen("on-client-connected", (event) => {
	console.log("已连接新播放状态源", event);
});

listen("on-client-disconnected", (event) => {
	console.log("已断开播放状态源", event);
});

listen("audio-player-msg", (event) => {
	console.log("接收到播放后端信息", event);
});

createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<App />
	</React.StrictMode>,
);

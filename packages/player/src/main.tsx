import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.sass";
import * as wsp from "@applemusic-like-lyrics/ws-protocol";
import {invoke} from "@tauri-apps/api";
import {listen} from "@tauri-apps/api/event";

(window as any).wsp = wsp;

invoke("reopen_connection", {
  addr: "localhost:11444",
});

invoke("get_connections").then(v => {
  console.log("当前已连接", v);
})

listen("on-client-connected", (event) => {
  console.log("已连接新播放状态源", event);
})

listen("on-client-disconnected", (event) => {
  console.log("已断开播放状态源", event);
})

createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

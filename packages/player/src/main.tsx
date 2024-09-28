import * as wsp from "@applemusic-like-lyrics/ws-protocol";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Provider } from "jotai";
import React from "react";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import "react-toastify/dist/ReactToastify.css";
import App from "./App";
import "./i18n";
import "./styles.css";
import "./utils/player";

(window as any).wsp = wsp;

const ErrorRender = (props: FallbackProps) => {
	console.error(props.error);
	return (
		<div>
			<h2>An unrecoverable error has occured</h2>
			<code>
				<pre>
					{props.error.message}
					{props.error.stack}
				</pre>
			</code>
		</div>
	);
};

addEventListener("on-system-titlebar-click-close", async () => {
	const win = getCurrentWindow();
	await win.close();
});

addEventListener("on-system-titlebar-click-resize", async () => {
	const win = getCurrentWindow();
	if (await win.isMaximizable()) {
		if (await win.isMaximized()) {
			await win.unmaximize();
			setSystemTitlebarResizeAppearance(
				SystemTitlebarResizeAppearance.Maximize,
			);
		} else {
			await win.maximize();
			setSystemTitlebarResizeAppearance(SystemTitlebarResizeAppearance.Restore);
		}
	}
});

const win = getCurrentWindow();
async function checkWindow() {
	if (await win.isMaximized()) {
		setSystemTitlebarResizeAppearance(SystemTitlebarResizeAppearance.Restore);
	} else {
		setSystemTitlebarResizeAppearance(SystemTitlebarResizeAppearance.Maximize);
	}
}
checkWindow();
win.onResized(checkWindow);

addEventListener("on-system-titlebar-click-minimize", async () => {
	const win = getCurrentWindow();
	await win.minimize();
});

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
		<ErrorBoundary fallbackRender={ErrorRender}>
			<Provider>
				<App />
			</Provider>
		</ErrorBoundary>
	</React.StrictMode>,
);

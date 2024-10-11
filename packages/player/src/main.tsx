import * as wsp from "@applemusic-like-lyrics/ws-protocol";
import * as RadixTheme from "@radix-ui/themes";
import { getCurrentWindow } from "@tauri-apps/api/window";
import * as Jotai from "jotai";
import { Provider } from "jotai";
import React from "react";
import ReactDOM from "react-dom";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "react-error-boundary";
import "react-toastify/dist/ReactToastify.css";
import JSXRuntime from "react/jsx-runtime";
import App from "./App";
import "./i18n";
import "./styles.css";
import "./utils/player";

(window as any).wsp = wsp;
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;
(window as any).Jotai = Jotai;
(window as any).RadixTheme = RadixTheme;
(window as any).JSXRuntime = JSXRuntime;

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

createRoot(document.getElementById("root") as HTMLElement).render(
	<ErrorBoundary fallbackRender={ErrorRender}>
		<Provider>
			<App />
		</Provider>
	</ErrorBoundary>,
);

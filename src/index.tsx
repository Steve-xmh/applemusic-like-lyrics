import "./config";
import { render } from "react-dom";
import { LyricView } from "./lyric-view";
import { GLOBAL_EVENTS } from "./global-events";
import * as React from "react";
import { MantineProvider, createStyles } from "@mantine/core";
import { getConfig, getFullConfig } from "./config/core";
import { currentWorkerScript, restartWorker } from "./worker";

export let cssContent = "";

const camelToSnakeCase = (str: string) =>
	str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export let mainViewElement: HTMLDivElement = document.createElement("div");
mainViewElement.id = "applemusic-like-lyrics-view";

function buildStylesheetFromConfig() {
	const variableTable: Map<string, string> = new Map();
	const result: string[] = [];
	mainViewElement.setAttribute("class", "");
	// 收集自己的变量
	// 构造成全局变量选择器
	result.push(":root {\n");
	const fullConfig = getFullConfig();
	for (const key in fullConfig) {
		const snakeKey = camelToSnakeCase(key);
		const value = fullConfig[key] || "";
		if (value === "true") {
			mainViewElement.classList.add(snakeKey);
		} else {
			mainViewElement.classList.remove(snakeKey);
		}
		variableTable.set(key, value);
		variableTable.set(snakeKey, value);
		result.push("    --applemusic-like-lyrics-");
		result.push(snakeKey);
		result.push(":");
		if (String(Number(value)) === value) {
			result.push(`${value}px`);
		} else {
			result.push(value);
		}
		result.push(";\n");
	}
	result.push("}\n");
	return result.join("");
}

function buildVariableStylesheet() {
	return buildStylesheetFromConfig() + "\n" + getConfig("customCssContent", "");
}

export function reloadStylesheet(content: string) {
	let varContent = buildVariableStylesheet();
	const existingVarStyle = document.getElementById(
		"apple-music-like-lyrics-var-style",
	);
	if (existingVarStyle) {
		if (existingVarStyle.innerHTML !== varContent) {
			existingVarStyle.innerHTML = varContent;
		}
	} else {
		let style = document.createElement("style") as HTMLStyleElement;
		style.id = "apple-music-like-lyrics-var-style";
		style.innerHTML = varContent;
		document.head.appendChild(style);
	}

	const existingStyle = document.getElementById(
		"apple-music-like-lyrics-style",
	);
	if (existingStyle) {
		if (existingStyle.innerHTML !== content) {
			existingStyle.innerHTML = content;
		}
	} else {
		let style = document.createElement("style") as HTMLStyleElement;
		style.id = "apple-music-like-lyrics-style";
		style.innerHTML = content;
		document.head.appendChild(style);
	}
}

let hideTimer: number = 0;
plugin.onLoad(() => {
	try {
		checkEapiRequestFuncName(); // 触发一次检查请求函数名字
	} catch {}

	const setControlsVisibility = (visible: boolean) => {
		const headerEl = document.querySelector("header");
		const windowCtlEl = document.querySelector(".m-winctrl");
		const commentDetailEl = document.querySelector(
			".g-singlec-comment-detail.z-show",
		);
		const pInfoEl = document.querySelector(".m-pinfo");
		const playerEl = document.querySelector("#main-player");
		if (visible) {
			headerEl?.classList?.remove("hide");
			windowCtlEl?.classList?.remove("hide");
			playerEl?.classList?.remove("hide");
			commentDetailEl?.classList?.remove("hide");
			pInfoEl?.classList?.remove("hide");
		} else {
			headerEl?.classList?.add("hide");
			windowCtlEl?.classList?.add("hide");
			playerEl?.classList?.add("hide");
			commentDetailEl?.classList?.add("hide");
			pInfoEl?.classList?.add("hide");
		}
	};

	const onCheckHide = () => {
		const autoEnabled = getConfig("autoHideControlBar", "false") !== "true";
		const hideDuration = Number(getConfig("autoHideDuration", "5000"));
		if (hideTimer !== 0) {
			clearTimeout(hideTimer);
			hideTimer = 0;
		}
		if (autoEnabled) {
			return;
		}
		setControlsVisibility(true);
		hideTimer = setTimeout(() => {
			const lyricPageOpened = !!document.querySelector(".g-singlec-ct.j-fflag");
			if (lyricPageOpened) {
				setControlsVisibility(false);
			}
		}, (hideDuration || 5) * 1000);
	};

	GLOBAL_EVENTS.addEventListener("lyric-page-open", () => {
		const autoEnabled = getConfig("autoHideControlBar", "false") === "true";
		if (autoEnabled) {
			window.addEventListener("mousemove", onCheckHide);
		}
	});

	GLOBAL_EVENTS.addEventListener("lyric-page-hide", () => {
		if (hideTimer !== 0) {
			clearTimeout(hideTimer);
			hideTimer = 0;
		}
		window.removeEventListener("mousemove", onCheckHide);
		setControlsVisibility(true);
	});

	// 监听歌词页面出现，然后添加功能
	const lyricPageObserver = new MutationObserver((m) => {
		for (const a of m) {
			a.addedNodes.forEach((el) => {
				if (el.nodeType === Node.ELEMENT_NODE) {
					const element = el as HTMLElement;
					const albumImageElement = element.querySelector(".cdimg > img");
					const nowPlayingFrame = element.querySelector(".n-single");
					if (albumImageElement && nowPlayingFrame) {
						reloadStylesheet(cssContent);
						render(<LyricView />, mainViewElement);
						nowPlayingFrame?.parentNode?.prepend(mainViewElement);
						nowPlayingFrame?.setAttribute("style", "display:none;");
						lyricPageObserver.disconnect();
						GLOBAL_EVENTS.dispatchEvent(
							new Event("lyric-page-open", undefined),
						);
					}
				}
			});
		}
	});
	lyricPageObserver.observe(document.body, {
		childList: true,
	});
	let nowPlayingElement: HTMLElement;
	const lyricPageOpenObserver = new MutationObserver((m) => {
		for (const a of m) {
			a.addedNodes.forEach((el) => {
				if (el.nodeType === Node.ELEMENT_NODE) {
					const element = el as HTMLElement;
					const albumImageElement = element.querySelector(".cdimg > img");
					const lyricViewDiv = element.querySelector(
						"#applemusic-like-lyrics-view",
					);
					if (albumImageElement && lyricViewDiv) {
						nowPlayingElement = element;
						GLOBAL_EVENTS.dispatchEvent(
							new Event("lyric-page-open", undefined),
						);
					}
				}
			});

			a.removedNodes.forEach((el) => {
				if (el.nodeType === Node.ELEMENT_NODE) {
					const element = el as HTMLElement;
					if (nowPlayingElement === element) {
						GLOBAL_EVENTS.dispatchEvent(
							new Event("lyric-page-hide", undefined),
						);
					}
				}
			});
		}
	});
	lyricPageOpenObserver.observe(document.body, {
		childList: true,
	});
	GLOBAL_EVENTS.addEventListener("config-saved", () =>
		reloadStylesheet(cssContent),
	);
	(async () => {
		const workerScript = await betterncm_native.fs.readFileText(
			`${plugin.pluginPath}/worker_script.js`,
		);
		restartWorker(workerScript);
	})();
	if (DEBUG) {
		setInterval(async function refreshStyle() {
			const curStyle = await betterncm_native.fs.readFileText(
				`${plugin.pluginPath}/index.css`,
			);
			if (cssContent !== curStyle) {
				cssContent = curStyle;
				reloadStylesheet(cssContent);
			}
		}, 3000);

		setInterval(async function refreshStyle() {
			const workerScript = await betterncm_native.fs.readFileText(
				`${plugin.pluginPath}/worker_script.js`,
			);
			if (currentWorkerScript !== workerScript) {
				restartWorker(workerScript);
			}
		}, 3000);
	} else {
		betterncm.fs
			.readFileText(`${plugin.pluginPath}/index.css`)
			.then((curStyle) => {
				if (cssContent !== curStyle) {
					cssContent = curStyle;
					reloadStylesheet(cssContent);
				}
			});
	}
});

window.addEventListener(
	"DOMContentLoaded",
	() => {
		reloadStylesheet(cssContent);
	},
	{
		once: true,
	},
);

// window.addEventListener(
// 	"load",
// 	() => {
// 		// 把所有被 Corona 遥测过的函数还原
// 		for (const key in window) {
// 			if (typeof window[key] === "function") {
// 				if ("__corona__" in window[key] && "__orig__" in window[key]) {
// 					// rome-ignore lint/suspicious/noExplicitAny: <explanation>
// 					window[key] = (window[key] as any).__orig__;
// 					log("已还原被遥测函数", `window.${key}`);
// 				}
// 			}
// 		}
// 	},
// 	{
// 		once: true,
// 	},
// );

if (OPEN_PAGE_DIRECTLY) {
	window.addEventListener(
		"load",
		() => {
			const btn = document.querySelector<HTMLAnchorElement>(
				"a[data-action='max']",
			);
			btn?.click();
		},
		{
			once: true,
		},
	);
}

reloadStylesheet(cssContent);

export const useStyles = createStyles;

export const ThemeProvider: React.FC<React.PropsWithChildren> = (props) => {
	return (
		<MantineProvider
			// withGlobalStyles
			withNormalizeCSS
			theme={{
				colorScheme: "dark",
				fontFamily: "PingFang SC, 微软雅黑, sans-serif",
				headings: {
					fontFamily: "PingFang SC, 微软雅黑, sans-serif",
				},
			}}
		>
			{props.children}
		</MantineProvider>
	);
};

import * as APIs from "./api";
import * as Utils from "./utils";
import * as WorkerAPIs from "./worker";
import { checkEapiRequestFuncName } from "./api";
import { log, warn } from "./logger";
import { onMainMessage } from "./worker";
if (DEBUG) {
	for (const key in APIs) {
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		(window as any)[key] = APIs[key];
	}
	for (const key in Utils) {
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		(window as any)[key] = APIs[key];
	}
	for (const key in WorkerAPIs) {
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		(window as any)[key] = WorkerAPIs[key];
	}
}

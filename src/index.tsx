import "./config";
import { render } from "react-dom";
import { LyricView } from "./lyric-view";
import { GLOBAL_EVENTS } from "./global-events";
import { getFullConfig, settingPrefix } from "./api";
import * as React from "react";
import { MantineProvider } from "@mantine/core";

export let cssContent = "";

const camelToSnakeCase = (str: string) =>
	str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export let mainViewElement: HTMLDivElement = document.createElement("div");
mainViewElement.id = "applemusic-like-lyrics-view";

function buildVariableStylesheet() {
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
	window.addEventListener("mousemove", () => {
		const autoEnabled =
			plugin.getConfig("autoHideControlBar", "false") !== "true";
		const hideDuration = Number(plugin.getConfig("autoHideDuration", "5000"));
		if (hideTimer !== 0) {
			clearTimeout(hideTimer);
			hideTimer = 0;
		}
		if (autoEnabled) {
			return;
		}
		const lyricPageOpened = !!document.querySelector(".g-singlec-ct.j-fflag");
		const headerEl = document.querySelector("header");
		const windowCtlEl = document.querySelector(".m-winctrl");
		const commentDetailEl = document.querySelector(
			".g-singlec-comment-detail.z-show",
		);
		const pInfoEl = document.querySelector(".m-pinfo");
		const playerEl = document.querySelector("#main-player");
		headerEl?.classList?.remove("hide");
		windowCtlEl?.classList?.remove("hide");
		playerEl?.classList?.remove("hide");
		commentDetailEl?.classList?.remove("hide");
		pInfoEl?.classList?.remove("hide");
		if (lyricPageOpened) {
			hideTimer = setTimeout(() => {
				headerEl?.classList?.add("hide");
				windowCtlEl?.classList?.add("hide");
				playerEl?.classList?.add("hide");
				commentDetailEl?.classList?.add("hide");
				pInfoEl?.classList?.add("hide");
			}, (hideDuration || 5) * 1000);
		}
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
					}
				}
			});
		}
	});
	lyricPageObserver.observe(document.body, {
		childList: true,
	});
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
						GLOBAL_EVENTS.dispatchEvent(
							new Event("lyric-page-open", undefined),
						);
					}
				}
			});

			a.removedNodes.forEach((el) => {
				if (el.nodeType === Node.ELEMENT_NODE) {
					const element = el as HTMLElement;
					const albumImageElement = element.querySelector(".cdimg > img");
					const lyricViewDiv = element.querySelector(
						"#applemusic-like-lyrics-view",
					);
					if (albumImageElement && lyricViewDiv) {
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
	if (DEBUG) {
		setInterval(async () => {
			const curStyle = await betterncm_native.fs.readFileText(
				`${plugin.pluginPath}/index.css`,
			);
			if (cssContent !== curStyle) {
				cssContent = curStyle;
				reloadStylesheet(cssContent);
			}
		}, 1000);
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

reloadStylesheet(cssContent);

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

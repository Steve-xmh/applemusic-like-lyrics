import "./config";
import { render } from "react-dom";
import { LyricView } from "./lyric-view";
import { GLOBAL_EVENTS } from "./global-events";
import { settingPrefix } from "./api";

export let cssContent = "";

const camelToSnakeCase = (str: string) =>
	str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export let mainViewElement: HTMLDivElement = document.createElement("div");
export let lyricPageElement: HTMLElement = document.createElement("section");

function processStylesheet(content: string) {
	const variableTable: Map<string, string> = new Map();
	const result: string[] = [];
	mainViewElement.setAttribute("class", "");
	// 收集自己的变量
	// 构造成全局变量选择器
	result.push(":root {\n");
	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i);
		if (key?.startsWith(settingPrefix)) {
			const trimedKey = key.substring(settingPrefix.length);
			const snakeKey = camelToSnakeCase(trimedKey);
			const value = localStorage.getItem(key) || "";
			if (value === "true") {
				mainViewElement.classList.add(snakeKey);
			} else {
				mainViewElement.classList.remove(snakeKey);
			}
			variableTable.set(trimedKey, value);
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
	}
	if (variableTable.get("lyricBackground") === "true") {
		lyricPageElement.classList.add("am-lyric-bg");
	} else {
		lyricPageElement.classList.remove("am-lyric-bg");
	}
	if (variableTable.get("lyricBackgroundBlurEffect") === "true") {
		lyricPageElement.classList.add("am-lyric-bg-blur");
	} else {
		lyricPageElement.classList.remove("am-lyric-bg-blur");
	}
	if (variableTable.get("lyricBackgroundDarkenEffect") === "true") {
		lyricPageElement.classList.add("am-lyric-bg-darken");
	} else {
		lyricPageElement.classList.remove("am-lyric-bg-darken");
	}
	if (variableTable.get("usePingFangFont") === "true") {
		lyricPageElement.classList.add("am-lyric-use-pingfang-font");
	} else {
		lyricPageElement.classList.remove("am-lyric-use-pingfang-font");
	}
	result.push("}\n");
	for (const line of content.split("\n")) {
		const ifExp = /\/\* if: (\!)?([a-z\-]+)(\?)? \*\//gi;
		const ifResult = line.trim().matchAll(ifExp);
		let shouldAdd = true;

		for (const subIfResult of ifResult) {
			const negative = !!subIfResult[1];
			const optional = !!subIfResult[3];
			if (negative) {
				if (variableTable[subIfResult[2].trim()] === "true" && !optional) {
					shouldAdd = false;
					break;
				}
			} else {
				if (variableTable[subIfResult[2].trim()] !== "true" && !optional) {
					shouldAdd = false;
					break;
				}
			}
		}

		if (shouldAdd) {
			result.push(line);
			result.push("\n");
		}
	}
	return result.join("");
}

export function reloadStylesheet(content: string) {
	let processed = processStylesheet(content);

	const existingStyle = document.getElementById(
		"apple-music-like-lyrics-style",
	);
	if (existingStyle) {
		existingStyle.innerHTML = processed;
	} else {
		let style = document.createElement("style") as HTMLStyleElement;
		style.id = "apple-music-like-lyrics-style";
		style.innerHTML = processed;
		document.head.appendChild(style);
	}
}

let hideTimer: number = 0;
plugin.onLoad((plugin) => {
	window.addEventListener("mousemove", () => {
		const autoEnabled =
			localStorage.getItem(`${settingPrefix}autoHideControlBar`) !== "true";
		const hideDuration = Number(
			localStorage.getItem(`${settingPrefix}autoHideDuration`),
		);
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
					const lyricViewDiv = element.querySelector(
						"#applemusic-like-lyrics-view",
					);
					if (albumImageElement && lyricViewDiv) {
						lyricPageElement = element;
						mainViewElement = lyricViewDiv as HTMLDivElement;
						reloadStylesheet(cssContent);
						render(<LyricView />, lyricViewDiv);
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
			const curStyle = await betterncm.fs.readFileText(
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

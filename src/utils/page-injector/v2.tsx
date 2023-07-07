import { Root, createRoot } from "react-dom/client";
import { ThemeProvider, cssContent, reloadStylesheet } from "../..";
import { getConfig, getFullConfig } from "../../config/core";
import { GLOBAL_EVENTS } from "../global-events";
import { Provider } from "jotai";
import React from "react";
import { ErrorBoundary } from "../../components/error-boundary";
import { NCMEnvWrapper } from "../../components/netease-api-wrapper";
import { LyricView } from "../../components/lyric-player";
import { log } from "../logger";

let hideTimer: number = 0;

export let mainViewElement: HTMLDivElement = document.createElement("div");
mainViewElement.id = "applemusic-like-lyrics-view";
let mainViewRoot: Root;

export let fmViewElement: HTMLDivElement = document.createElement("div");
fmViewElement.id = "applemusic-like-lyrics-view-fm";
let fmViewRoot: Root;

const FMPlayerWrapper: React.FC = () => {
	const [height, setHeight] = React.useState(0);

	React.useLayoutEffect(() => {
		const mnView: HTMLElement | null = document.querySelector(".g-mn");
		if (mnView) {
			setHeight(mnView.getBoundingClientRect().height);

			const resize = () => {
				setHeight(mnView.getBoundingClientRect().height);
			};

			const mnViewObs = new MutationObserver(resize);

			mnViewObs.observe(mnView, {
				attributes: true,
				attributeFilter: ["class"],
			});

			window.addEventListener("resize", resize);

			return () => {
				mnViewObs.disconnect();
				window.removeEventListener("resize", resize);
			};
		}
	}, []);

	return (
		<Provider>
			<NCMEnvWrapper />
			<div
				style={{
					height,
				}}
			>
				<ErrorBoundary>
					<ThemeProvider>
						<LyricView isFM />
					</ThemeProvider>
				</ErrorBoundary>
			</div>
		</Provider>
	);
};

const camelToSnakeCase = (str: string) =>
	str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export function buildStylesheetFromConfig() {
	const variableTable: Map<string, string> = new Map();
	const result: string[] = [];
	mainViewElement.setAttribute("class", "");
	fmViewElement.setAttribute("class", "amll-fm-view");
	// 收集自己的变量
	// 构造成全局变量选择器
	result.push(":root {\n");
	const fullConfig = getFullConfig();
	for (const key in fullConfig) {
		const snakeKey = camelToSnakeCase(key);
		const value = fullConfig[key] || "";
		if (value === "true") {
			mainViewElement.classList.add(snakeKey);
			fmViewElement.classList.add(snakeKey);
		} else {
			mainViewElement.classList.remove(snakeKey);
			fmViewElement.classList.remove(snakeKey);
		}
		variableTable.set(key, value);
		variableTable.set(snakeKey, value);
		const varkey = `--applemusic-like-lyrics-${snakeKey}`;
		if (String(Number(value)) === value) {
			document.body.style.setProperty(varkey, `${value}px`);
		} else if (typeof value === "string" && !value.includes("\n")) {
			document.body.style.setProperty(varkey, value);
		} else {
			("true");
		}
		result.push(";\n");
	}
	result.push("}\n");
	return result.join("");
}

export function initInjector() {
	if (APP_CONF.isOSX) document.body.classList.add("amll-is-osx");

	const setControlsVisibility = (visible: boolean) => {
		if (visible) {
			document.body.classList.remove("amll-hide-controls");
			// log("已显示控制按钮")
		} else {
			document.body.classList.add("amll-hide-controls");
			// log("已隐藏控制按钮")
		}
	};

	const onCheckHide = () => {
		const autoEnabled = getConfig("autoHideControlBar", "false") !== "true";
		const hideDuration = Number(getConfig("autoHideDuration", "5000"));
		// log("正在检查移动", autoEnabled, hideDuration)
		if (hideTimer !== 0) {
			clearTimeout(hideTimer);
			hideTimer = 0;
		}
		if (autoEnabled) {
			return;
		}
		setControlsVisibility(true);
		hideTimer = setTimeout(() => {
			setControlsVisibility(false);
		}, (hideDuration || 5) * 1000);
	};

	GLOBAL_EVENTS.addEventListener("lyric-page-open", () => {
		document.body.classList.add("amll-lyric-page-open");
		const autoEnabled = getConfig("autoHideControlBar", "false") === "true";
		if (autoEnabled) {
			window.addEventListener("mousemove", onCheckHide);
		}
	});

	GLOBAL_EVENTS.addEventListener("lyric-page-hide", () => {
		document.body.classList.remove("amll-lyric-page-open");
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

	let injected = false;
	let fmLyricPageObserver: MutationObserver | undefined;
	window.addEventListener("hashchange", () => {
		fmLyricPageObserver?.disconnect();
		if (location.hash === "#/m/fm/") {
			if (!injected) {
				log("正在插入私人 FM 歌词显示");
				const check = () => {
					const element = document;
					const fmPageEl = element.querySelector(".m-fm");
					const playViewEl = element.querySelector(".g-play") ?? fmPageEl;
					log("搜索 FM 歌词组件", fmPageEl, playViewEl);
					if (fmPageEl && playViewEl) {
						if (!fmViewRoot) {
							fmViewRoot = createRoot(fmViewElement);
							fmViewRoot.render(<FMPlayerWrapper />);
						}
						reloadStylesheet(cssContent);
						playViewEl?.parentNode?.prepend(fmViewElement);
						playViewEl?.setAttribute("style", "display:none;");
						fmLyricPageObserver?.disconnect();
						GLOBAL_EVENTS.dispatchEvent(
							new Event("fm-lyric-page-open", undefined),
						);
					}
				};
				fmLyricPageObserver = new MutationObserver(check);
				fmLyricPageObserver.observe(document.body, {
					childList: true,
					subtree: true,
				});
				check();
			}
		} else {
			GLOBAL_EVENTS.dispatchEvent(new Event("fm-lyric-page-hide", undefined));
		}
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
						if (!mainViewRoot) {
							mainViewRoot = createRoot(mainViewElement);
							mainViewRoot.render(
								<Provider>
									<ErrorBoundary>
										<ThemeProvider>
											<NCMEnvWrapper />
											<LyricView />
										</ThemeProvider>
									</ErrorBoundary>
								</Provider>,
							);
						}
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
}

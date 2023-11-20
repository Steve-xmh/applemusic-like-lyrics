/**
 * @fileoverview
 * 用于为 2.10.X 版本的 NCM 注入歌词页面的模块
 */

import { openLyricPage } from ".";
import { log } from "../utils/logger";

function onLyricPageButtonClicked(evt: MouseEvent) {
	// 保留按下 Shift 后回到默认歌词页面的行为
	if (evt.shiftKey) {
		return;
	}
	evt.preventDefault();
	evt.stopImmediatePropagation();
	evt.stopPropagation();
	openLyricPage();
}

export async function injectLyricPage() {
	const coverDiv = (await betterncm.utils.waitForElement(
		"#x-g-mn .m-pinfo .j-flag",
	)) as HTMLDivElement;
	new MutationObserver((m) => {
		m.forEach((m) => {
			for (const n of m.addedNodes) {
				if (n.nodeType === Node.ELEMENT_NODE) {
					const el = n as Element;
					const cover = el.querySelector(".cover");
					if (cover) {
						cover.addEventListener(
							"click",
							onLyricPageButtonClicked as EventListener,
						);
						break;
					} else if (el.classList.contains("cover")) {
						el.addEventListener(
							"click",
							onLyricPageButtonClicked as EventListener,
						);
						break;
					}
				}
			}
		});
	}).observe(coverDiv, {
		childList: true,
	});
	const lyricPageButton = (await betterncm.utils.waitForElement(
		"#x-g-mn .m-pinfo .j-flag .cover",
	)) as HTMLAnchorElement;
	lyricPageButton.addEventListener("click", onLyricPageButtonClicked);
	log("已找到歌词页面按钮", lyricPageButton);
}

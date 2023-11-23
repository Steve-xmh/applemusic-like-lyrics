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
	const lyricPageButton = (await betterncm.utils.waitForElement(
		".miniVinylWrapper",
	)) as HTMLAnchorElement;
	lyricPageButton.addEventListener("click", onLyricPageButtonClicked);
	log("已找到歌词页面按钮", lyricPageButton);
}

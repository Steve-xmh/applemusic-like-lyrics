/**
 * @fileoverview
 * 用于为开发环境的伪 NCM 注入歌词页面的模块
 */

import { openLyricPage } from ".";

export async function injectLyricPage() {
	document
		.querySelector("button#open-page-btn")
		?.addEventListener("click", () => {
			openLyricPage();
		});
}

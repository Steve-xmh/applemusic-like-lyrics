/**
 * @fileoverview
 * 一个播放歌词的组件
 * @author SteveXMH
 */

import type { Disposable, HasElement, LyricLine } from "../interfaces";
import { LyricLineEl } from "./lyric-line";
import jss from "jss";
import preset from "jss-preset-default";

jss.setup(preset());

export class LyricPlayer extends EventTarget implements HasElement, Disposable {
	private element: HTMLElement = document.createElement("div");
	private currentTime: number = 0;
	private lyricLines: LyricLine[] = [];
	private lyricLinesEl: LyricLineEl[] = [];
	private lyricLinesSize: Map<LyricLineEl, [number, number]> = new Map();
	private resizeObserver: ResizeObserver = new ResizeObserver(() => {
		this.rebuildStyle();
	});
	public readonly style = jss.createStyleSheet({
		lyricPlayer: {
			padding: "1rem",
			boxSizing: "border-box",
			fontSize: "5vh",
			fontWeight: "bold",
			width: "100%",
			height: "100%",
			overflow: "hidden",
			maxWidth: "100%",
			maxHeight: "100%",
			zIndex: 1,
			color: "var(--amll-lyric-line-color)",
			mixBlendMode: "plus-lighter",
		},
		lyricLine: {
			position: "absolute",
			transformOrigin: "top left",
			padding: "2vh",
			opacity: 0.15,
			transition: "opacity 0.3s",
			"&.active": {
				opacity: 1
			}
		},
		lyricSubLine: {
			fontSize: "50%",
		},
	});
	constructor() {
		super();
		this.element.setAttribute("class", this.style.classes.lyricPlayer);
		this.rebuildStyle();
		this.resizeObserver.observe(this.element);
		this.style.attach();
	}
	rebuildStyle() {
		let style = "";
		style += "--amll-lyric-player-width:";
		style += this.element.clientWidth;
		style += "px;";
		style += "--amll-lyric-player-height:";
		style += this.element.clientHeight;
		style += "px;";
		style += "--amll-lyric-line-color:";
		style += "#FFFFFF;";
		this.element.setAttribute("style", style);
	}
	setLyricLines(lines: LyricLine[]) {
		this.lyricLines = lines;
		this.lyricLinesEl.forEach((el) => el.dispose());
		this.lyricLinesEl = lines.map((line) => new LyricLineEl(this, line));
		this.lyricLinesEl.forEach((el) =>
			this.element.appendChild(el.getElement()),
		);
		this.calcLayout();
	}
	calcLayout() {
		this.lyricLinesEl.forEach((el) => {
			this.lyricLinesSize.set(el, [
				el.getElement().clientWidth,
				el.getElement().clientHeight,
			]);
		});
		let curPos = 0;
		this.lyricLinesEl.forEach((el) => {
			el.setTransform(0, curPos, 0.95);
			curPos += this.lyricLinesSize.get(el)!![1] * 0.95;
		});
	}
	getElement(): HTMLElement {
		return this.element;
	}
	/**
	 * 设置当前播放进度，单位为毫秒，此时将会更新内部的歌词进度信息
	 *
	 * 调用完成后，可以每帧调用 `update` 函数来执行歌词动画效果
	 * @param time 当前播放进度，单位为毫秒
	 */
	setCurrentTime(time: number) {
		this.currentTime = time;
	}
	dispose(): void {
		this.element.remove();
		this.resizeObserver.disconnect();
		this.style.detach();
		this.lyricLinesEl.forEach((el) => el.dispose());
	}
}

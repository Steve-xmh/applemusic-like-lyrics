/**
 * @fileoverview
 * 一个播放歌词的组件
 * @author SteveXMH
 */

import type { Disposable, HasElement, LyricLine } from "../../interfaces";
import "../../styles/index.css";
import styles from "../../styles/lyric-player.module.css";
import { debounceFrame } from "../../utils/debounce";
import { LyricPlayerBase } from "../base";
import { BottomLineEl } from "../bottom-line";
import { InterludeDots } from "./interlude-dots";
import { LyricLineEl, type RawLyricLineMouseEvent } from "./lyric-line";

/**
 * 歌词行鼠标相关事件，可以获取到歌词行的索引和歌词行元素
 */
export class LyricLineMouseEvent extends MouseEvent {
	constructor(
		/**
		 * 歌词行索引
		 */
		public readonly lineIndex: number,
		/**
		 * 歌词行元素
		 */
		public readonly line: LyricLineEl,
		event: MouseEvent,
	) {
		super(`line-${event.type}`, event);
	}
}

export type LyricLineMouseEventListener = (evt: LyricLineMouseEvent) => void;

/**
 * 歌词播放组件，本框架的核心组件
 *
 * 尽可能贴切 Apple Music for iPad 的歌词效果设计，且做了力所能及的优化措施
 */
export class DomLyricPlayer
	extends LyricPlayerBase
	implements HasElement, Disposable
{
	override currentLyricLineObjects: LyricLineEl[] = [];
	private debounceCalcLayout = debounceFrame(async () => {
		this.calcLayout(true, true);
		this.currentLyricLineObjects.forEach((el, i) => {
			el.markMaskImageDirty().then(() => {
				if (this.hotLines.has(i)) {
					el.enable(this.currentTime);
				}
			});
		});
	}, 5);

	override onResize(): void {
		const styles = getComputedStyle(this.element);
		const innerWidth =
			this.element.clientWidth -
			Number.parseFloat(styles.paddingLeft) -
			Number.parseFloat(styles.paddingRight);
		const innerHeight =
			this.element.clientHeight -
			Number.parseFloat(styles.paddingTop) -
			Number.parseFloat(styles.paddingBottom);
		this.innerSize[0] = innerWidth;
		this.innerSize[1] = innerHeight;
		this.rebuildStyle();
		this.currentLyricLineObjects.forEach((el, i) => {
			el.markMaskImageDirty().then(() => {
				if (this.hotLines.has(i)) {
					el.enable(this.currentTime);
				}
			});
		});
		for (const el of this.currentLyricLineObjects) {
			el.markMaskImageDirty();
		}
		this.debounceCalcLayout();
	}

	readonly supportPlusLighter = CSS.supports("mix-blend-mode", "plus-lighter");
	readonly supportMaskImage = CSS.supports("mask-image", "none");
	readonly innerSize: [number, number] = [0, 0];
	private readonly onLineClickedHandler = (e: RawLyricLineMouseEvent) => {
		const evt = new LyricLineMouseEvent(
			this.lyricLinesIndexes.get(e.line) ?? -1,
			e.line,
			e,
		);
		if (!this.dispatchEvent(evt)) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
		}
	};
	/**
	 * 是否为非逐词歌词
	 * @internal
	 */
	_getIsNonDynamic() {
		return this.isNonDynamic;
	}
	private _baseFontSize = Number.parseFloat(
		getComputedStyle(this.element).fontSize,
	);
	public get baseFontSize() {
		return this._baseFontSize;
	}
	constructor() {
		super();
		this.interludeDots = new InterludeDots();
		this.bottomLine = new BottomLineEl(this);
		this.rebuildStyle();
		this.element.classList.add("amll-lyric-player", "dom");
		if (this.disableSpring) {
			this.element.classList.add(styles.disableSpring);
		}
	}

	private rebuildStyle() {
		this._baseFontSize = Number.parseFloat(
			getComputedStyle(this.element).fontSize,
		);
		let style = "";
		style += "--amll-lp-width:";
		const width = this.innerSize[0] - this._baseFontSize * 2;
		style += `${width.toFixed(4)}px;`;
		style += "--amll-lp-height:";
		style += `${(this.innerSize[1] - this._baseFontSize * 2).toFixed(4)}px;`;
		// 原本想用 calc 来计算的，但是发现算式复杂之后无法解析，所以只能用 JS 来计算直接结果了
		style += "--amll-lp-line-width:";
		if (this.innerSize[0] < 768) {
			style += `${width.toFixed(4)}px;`;
		} else {
			style += `${(width * 0.8).toFixed(4)}px;`;
		}

		this.element.setAttribute("style", style);
	}

	override setWordFadeWidth(value = 0.5) {
		super.setWordFadeWidth(value);
		for (const el of this.currentLyricLineObjects) {
			el.markMaskImageDirty();
		}
	}

	/**
	 * 设置当前播放歌词，要注意传入后这个数组内的信息不得修改，否则会发生错误
	 * @param lines 歌词数组
	 * @param initialTime 初始时间，默认为 0
	 */
	override setLyricLines(lines: LyricLine[], initialTime = 0) {
		super.setLyricLines(lines, initialTime);

		for (const line of this.currentLyricLineObjects) {
			line.removeMouseEventListener("click", this.onLineClickedHandler);
			line.removeMouseEventListener("contextmenu", this.onLineClickedHandler);
			line.dispose();
		}

		// 创建新的歌词行元素
		this.currentLyricLineObjects = this.processedLines.map((line, i) => {
			const lineEl = new LyricLineEl(this, line);
			lineEl.addMouseEventListener("click", this.onLineClickedHandler);
			lineEl.addMouseEventListener("contextmenu", this.onLineClickedHandler);
			this.element.appendChild(lineEl.getElement());
			this.lyricLinesIndexes.set(lineEl, i);
			lineEl.markMaskImageDirty();
			return lineEl;
		});

		this.setLinePosXSpringParams({});
		this.setLinePosYSpringParams({});
		this.setLineScaleSpringParams({});
		this.calcLayout(true, true);
	}

	override pause() {
		super.pause();
		this.interludeDots.pause();
		for (const line of this.currentLyricLineObjects) {
			line.pause();
		}
	}

	override resume() {
		super.resume();
		this.interludeDots.resume();
		for (const line of this.currentLyricLineObjects) {
			line.resume();
		}
	}

	override update(delta = 0) {
		super.update(delta);
		if (!this.isPageVisible) return;
		const deltaS = delta / 1000;
		this.interludeDots.update(delta);
		this.bottomLine.update(deltaS);
		for (const line of this.currentLyricLineObjects) {
			line.update(deltaS);
		}
	}

	override dispose(): void {
		super.dispose();
		this.element.remove();
		for (const el of this.currentLyricLineObjects) {
			el.dispose();
		}
		this.bottomLine.dispose();
		this.interludeDots.dispose();
	}
}

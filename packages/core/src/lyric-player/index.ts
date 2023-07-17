/**
 * @fileoverview
 * 一个播放歌词的组件
 * @author SteveXMH
 */

import type { Disposable, HasElement, LyricLine } from "../interfaces";
import { eqSet } from "../utils/eq-set";
import { InterludeDots } from "./interlude-dots";
import { LyricLineEl } from "./lyric-line";
import jss from "jss";
import preset from "jss-preset-default";

jss.setup(preset());

export class LyricPlayer extends EventTarget implements HasElement, Disposable {
	private element: HTMLElement = document.createElement("div");
	private currentTime: number = 0;
	private lyricLines: LyricLine[] = [];
	private processedLines: LyricLine[] = [];
	private lyricLinesEl: LyricLineEl[] = [];
	private lyricLinesSize: Map<LyricLineEl, [number, number]> = new Map();
	private hotLines: Set<number> = new Set();
	private bufferedLines: Set<number> = new Set();
	private scrollToIndex: number = 0;
	private resizeObserver: ResizeObserver = new ResizeObserver(() => {
		this.size = [this.element.clientWidth, this.element.clientHeight];
		this.rebuildStyle();
		this.calcLayout(true);
		this.lyricLinesEl.forEach((el) => el.updateMaskImage());
	});
	private alignCenter = false;
	private size: [number, number] = [0, 0];
	private interludeDots: InterludeDots;
	readonly supportPlusLighter = CSS.supports("mix-blend-mode", "plus-lighter");
	readonly supportMaskImage = CSS.supports("mask-image", "none");
	public readonly style = jss.createStyleSheet({
		lyricPlayer: {
			userSelect: "none",
			padding: "1rem",
			boxSizing: "border-box",
			fontSize: "max(5vh, 12px)",
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
			transformOrigin: "left",
			transition: "transform 0.5s",
			maxWidth: "65%",
			padding: "2vh",
		},
		lyricDuetLine: {
			textAlign: "right",
			transformOrigin: "right",
		},
		lyricBgLine: {
			opacity: 0,
			fontSize: "max(50%, 10px)",
			transition: "transform 0.5s, opacity 0.25s",
			"&.active": {
				transition: "transform 0.5s, opacity 0.25s 0.25s",
				opacity: 1,
			},
		},
		lyricMainLine: {
			// opacity: 0.15,
			// transition: "opacity 0.3s 0.25s",
			// "&.active": {
			// 	opacity: 1,
			// },
			"& > *": {
				display: "inline-block",
				whiteSpace: "pre-wrap",
			},
		},
		lyricSubLine: {
			fontSize: "max(50%, 10px)",
			opacity: 0.5,
		},
		interludeDots: {
			fontSize: "max(50%, 10px)",
			opacity: 0.5,
			"& > *": {
				content: '"*"',
			},
		},
		"@supports (mix-blend-mode: plus-lighter)": {
			lyricMainLine: {
				// opacity: 0.15,
				// "&.active": {
				// 	opacity: 0.75,
				// },
			},
			lyricSubLine: {
				opacity: 0.3,
			},
		},
	});
	constructor() {
		super();
		this.interludeDots = new InterludeDots(this);
		this.element.setAttribute("class", this.style.classes.lyricPlayer);
		this.rebuildStyle();
		this.resizeObserver.observe(this.element);
		this.element.appendChild(this.interludeDots.getElement());
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
		style += "--amll-player-time:";
		style += this.currentTime;
		style += ";";
		this.element.setAttribute("style", style);
	}
	/**
	 * 设置当前播放歌词，要注意传入后这个数组内的信息不得修改，否则会发生错误
	 * @param lines 歌词数组
	 */
	setLyricLines(lines: LyricLine[]) {
		this.lyricLines = lines;
		const timeOffset = 750;
		this.processedLines = lines.map((line, i, lines) => {
			if (line.isBG)
				return {
					...line,
				};
			else {
				const lastLine = lines[i - 1];
				const pastLine = lines[i - 2];
				if (lastLine?.isBG && pastLine) {
					if (pastLine.endTime < line.startTime) {
						return {
							...line,
							startTime:
								Math.max(pastLine.endTime, line.startTime - timeOffset) ||
								line.startTime,
						};
					}
				} else if (lastLine?.endTime) {
					if (lastLine.endTime < line.startTime) {
						return {
							...line,
							startTime:
								Math.max(lastLine?.endTime, line.startTime - timeOffset) ||
								line.startTime,
						};
					}
				}
				return {
					...line,
				};
			}
		});
		this.lyricLinesEl.forEach((el) => el.dispose());
		this.lyricLinesEl = this.processedLines.map(
			(line) => new LyricLineEl(this, line),
		);
		this.lyricLinesEl.forEach(
			(el) => (this.element.appendChild(el.getElement()), el.updateMaskImage()),
		);
		this.calcLayout(true);
	}
	calcLayout(reflow = false) {
		if (reflow)
			this.lyricLinesEl.forEach((el) => {
				this.lyricLinesSize.set(el, [
					el.getElement().clientWidth,
					el.getElement().clientHeight,
				]);
			});
		const SCALE_ASPECT = 0.95;
		const scrollOffset = this.lyricLinesEl
			.slice(0, this.scrollToIndex)
			.reduce(
				(acc, el) =>
					acc + (el.getLine().isBG ? 0 : this.lyricLinesSize.get(el)!![1]),
				0,
			);
		let curPos = -scrollOffset;
		if (this.alignCenter) {
			curPos += this.element.clientHeight / 2;
			const curLine = this.lyricLinesEl[this.scrollToIndex];
			if (curLine) {
				const lineHeight = this.lyricLinesSize.get(curLine)!![1];
				curPos -= lineHeight / 2;
			}
		}
		this.lyricLinesEl.forEach((el, i) => {
			const isActive = this.bufferedLines.has(i);
			const line = el.getLine();
			let left = 0;
			if (line.isDuet) {
				left = this.size[0] - this.lyricLinesSize.get(el)!![0];
			}
			el.setTransform(left, curPos, isActive ? 1 : SCALE_ASPECT, reflow);
			if (line.isBG && isActive) {
				curPos += this.lyricLinesSize.get(el)!![1];
			} else if (!line.isBG) {
				curPos += this.lyricLinesSize.get(el)!![1];
			}
		});
	}
	getCurrentTime() {
		return this.currentTime;
	}
	getLyrics() {
		return this.lyricLines;
	}
	getElement(): HTMLElement {
		return this.element;
	}
	/**
	 * 设置当前播放进度，单位为毫秒且**必须是整数**，此时将会更新内部的歌词进度信息
	 * 内部会根据调用间隔和播放进度自动决定如何滚动和显示歌词，所以这个的调用频率越快越准确越好
	 *
	 * 调用完成后，可以每帧调用 `update` 函数来执行歌词动画效果
	 * @param time 当前播放进度，单位为毫秒
	 */
	setCurrentTime(time: number, isSeek = false) {
		this.currentTime = time;
		this.element.style.setProperty("--amll-player-time", `${time}`);
		const removedIds = new Set<number>();
		const addedIds = new Set<number>();
		this.hotLines.forEach((lastHotId) => {
			const line = this.processedLines[lastHotId];
			if (line) {
				if (line.startTime > time || line.endTime <= time) {
					if (line.isBG) {
						this.hotLines.delete(lastHotId - 1);
						removedIds.add(lastHotId - 1);
						if (isSeek) this.lyricLinesEl[lastHotId - 1]?.disable();
						this.hotLines.delete(lastHotId);
						removedIds.add(lastHotId);
						if (isSeek) this.lyricLinesEl[lastHotId].disable();
					} else {
						const nextLine = this.processedLines[lastHotId + 1];
						if (nextLine?.isBG) {
						} else {
							this.hotLines.delete(lastHotId);
							removedIds.add(lastHotId);
							if (isSeek) this.lyricLinesEl[lastHotId].disable();
						}
					}
				}
			} else {
				this.hotLines.delete(lastHotId);
				removedIds.add(lastHotId);
				if (isSeek) this.lyricLinesEl[lastHotId].disable();
			}
		});
		this.processedLines.forEach((line, id, arr) => {
			if (!line.isBG && line.startTime <= time && line.endTime > time) {
				if (!this.hotLines.has(id)) {
					this.hotLines.add(id);
					addedIds.add(id);
					if (isSeek) this.lyricLinesEl[id].enable();
					if (arr[id + 1]?.isBG) {
						this.hotLines.add(id + 1);
						addedIds.add(id + 1);
						if (isSeek) this.lyricLinesEl[id + 1].enable();
					}
				}
			}
		});
		if (isSeek) {
			if (this.bufferedLines.size > 0) {
				this.scrollToIndex = Math.min(...this.bufferedLines);
			} else {
				this.scrollToIndex = this.processedLines.findIndex(
					(line) => line.startTime >= time,
				);
			}
			this.bufferedLines.clear();
			this.hotLines.forEach((v) => this.bufferedLines.add(v));
			this.calcLayout(true);
		} else if (removedIds.size > 0 || addedIds.size > 0) {
			if (removedIds.size === 0 && addedIds.size > 0) {
				addedIds.forEach((v) => {
					this.bufferedLines.add(v);
					this.lyricLinesEl[v].enable();
				});
				this.scrollToIndex = Math.min(...this.bufferedLines);
			} else if (addedIds.size === 0 && removedIds.size > 0) {
				if (eqSet(removedIds, this.bufferedLines)) {
					this.bufferedLines.forEach((v) => {
						if (!this.hotLines.has(v)) {
							this.bufferedLines.delete(v);
							this.lyricLinesEl[v].disable();
						}
					});
				}
			} else if (addedIds.size === 1 && removedIds.size === 1) {
				this.bufferedLines.clear();
				addedIds.forEach((v) => {
					this.bufferedLines.add(v);
					this.lyricLinesEl[v].enable();
				});
				this.scrollToIndex = Math.min(...this.bufferedLines);
			} else {
				addedIds.forEach((v) => {
					this.bufferedLines.add(v);
					this.lyricLinesEl[v].enable();
				});
				removedIds.forEach((v) => {
					this.bufferedLines.delete(v);
					this.lyricLinesEl[v].disable();
				});
				if (this.bufferedLines.size > 0)
					this.scrollToIndex = Math.min(...this.bufferedLines);
			}
			this.calcLayout();
		}
	}
	/**
	 * 更新动画，这个函数应该逐帧调用
	 * @param delta 距离上一次被调用到现在的时长，单位为毫秒（可为浮点数）
	 */
	update(delta: number = 0) {
		this.bufferedLines.forEach((id) => {
			this.lyricLinesEl[id]?.update(delta);
		});
	}
	dispose(): void {
		this.element.remove();
		this.resizeObserver.disconnect();
		this.style.detach();
		this.lyricLinesEl.forEach((el) => el.dispose());
	}
}

/**
 * @fileoverview
 * 一个播放歌词的组件
 * @author SteveXMH
 */

import type { Disposable, HasElement, LyricLine } from "../interfaces";
import { eqSet } from "../utils/eq-set";
import { SpringParams } from "../utils/spring";
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
	private resizeObserver: ResizeObserver = new ResizeObserver((e) => {
		const rect = e[0].contentRect;
		this.size = [rect.width, rect.height];
		this.pos = [rect.left, rect.top];
		this.rebuildStyle();
		this.calcLayout(true);
		this.lyricLinesEl.forEach((el) => el.updateMaskImage());
	});
	private enableBlur = true;
	size: [number, number] = [0, 0];
	pos: [number, number] = [0, 0];
	private interludeDots: InterludeDots;
	readonly supportPlusLighter = CSS.supports("mix-blend-mode", "plus-lighter");
	readonly supportMaskImage = CSS.supports("mask-image", "none");
	disableSpring = false;
	alignAnchor: "top" | "bottom" | number = 0.5;
	/**
	 * 设置是否使用物理弹簧算法实现歌词动画效果，默认启用
	 *
	 * 如果启用，则会通过弹簧算法实时处理歌词位置，但是需要性能足够强劲的电脑方可流畅运行
	 *
	 * 如果不启用，则会回退到基于 `transition` 的过渡效果，对低性能的机器比较友好，但是效果会比较单一
	 */
	setEnableSpring(enable = true) {
		this.disableSpring = !enable;
		if (enable) {
			this.element.classList.remove(this.style.classes.disableSpring);
		} else {
			this.element.classList.add(this.style.classes.disableSpring);
		}
		this.calcLayout(true);
	}
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
			contain: "strict",
		},
		lyricLine: {
			position: "absolute",
			transformOrigin: "left",
			maxWidth: "65%",
			padding: "2vh",
			contain: "content",
			transition: "filter 0.25s",
		},
		"@media (max-width: 1024px)": {
			lyricLine: {
				maxWidth: "75%",
				padding: "1vh",
			},
		},
		lyricDuetLine: {
			textAlign: "right",
			transformOrigin: "right",
		},
		lyricBgLine: {
			opacity: 0,
			fontSize: "max(50%, 10px)",
			transition: "opacity 0.25s",
			"&.active": {
				transition: "opacity 0.25s 0.25s",
				opacity: 1,
			},
		},
		lyricMainLine: {
			transition: "opacity 0.3s 0.25s",
			"& > *": {
				display: "inline-block",
				whiteSpace: "pre-wrap",
			},
		},
		lyricSubLine: {
			fontSize: "max(50%, 10px)",
			opacity: 0.5,
		},
		disableSpring: {
			"& > *": {
				transition: "filter 0.25s, transform 0.5s",
			},
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
		tmpDisableTransition: {
			transition: "none !important",
		},
	});
	constructor() {
		super();
		this.interludeDots = new InterludeDots(this);
		this.element.setAttribute("class", this.style.classes.lyricPlayer);
		if (this.disableSpring) {
			this.element.classList.add(this.style.classes.disableSpring);
		}
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
	 * 设置是否启用歌词行的模糊效果
	 * @param enable 是否启用
	 */
	setEnableBlur(enable: boolean) {
		if (this.enableBlur === enable) return;
		this.enableBlur = enable;
		this.calcLayout();
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
		this.setLinePosXSpringParams({});
		this.setLinePosYSpringParams({});
		this.setLineScaleSpringParams({});
		this.calcLayout(true);
	}
	calcLayout(reflow = false) {
		if (reflow)
			this.lyricLinesEl.forEach((el) => {
				const size: [number, number] = [
					el.getElement().clientWidth,
					el.getElement().clientHeight,
				];
				this.lyricLinesSize.set(el, size);
				el.lineSize = size;
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
		if (this.alignAnchor === "bottom") {
			curPos += this.element.clientHeight / 2;
			const curLine = this.lyricLinesEl[this.scrollToIndex];
			if (curLine) {
				const lineHeight = this.lyricLinesSize.get(curLine)!![1];
				curPos -= lineHeight / 2;
			}
		} else if (typeof this.alignAnchor === "number") {
			curPos += this.element.clientHeight * this.alignAnchor;
			const curLine = this.lyricLinesEl[this.scrollToIndex];
			if (curLine) {
				const lineHeight = this.lyricLinesSize.get(curLine)!![1];
				curPos -= lineHeight;
			}
		}
		const latestIndex = Math.max(...this.bufferedLines);
		let delay = 0;
		this.lyricLinesEl.forEach((el, i) => {
			const isActive =
				this.bufferedLines.has(i) ||
				(i >= this.scrollToIndex && i < latestIndex);
			const line = el.getLine();
			let left = 0;
			if (line.isDuet) {
				left = this.size[0] - this.lyricLinesSize.get(el)!![0];
			}
			el.setTransform(
				left,
				curPos,
				isActive ? 1 : SCALE_ASPECT,
				!isActive && i <= this.scrollToIndex ? 1 / 3 : 1,
				this.enableBlur
					? 3 *
					  (isActive
							? 0
							: 1 +
							  (i < this.scrollToIndex
									? Math.abs(this.scrollToIndex - i)
									: Math.abs(i - Math.max(this.scrollToIndex, latestIndex))))
					: 0,
				reflow,
				delay,
			);
			if (line.isBG && isActive) {
				curPos += this.lyricLinesSize.get(el)!![1];
			} else if (!line.isBG) {
				curPos += this.lyricLinesSize.get(el)!![1];
			}
			if (curPos >= 0) {
				delay += 0.05;
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
		// 我在这里定义了歌词的选择状态：
		// 普通行：当前不处于时间范围内的歌词行
		// 热行：当前绝对处于播放时间内的歌词行，且一般会被立刻加入到缓冲行中
		// 缓冲行：一般处于播放时间后的歌词行，会因为当前播放状态的缘故推迟解除状态

		// 然后我们需要让歌词行为如下：
		// 如果当前仍有缓冲行的情况下加入新热行，则不会解除当前缓冲行，且也不会修改当前滚动位置
		// 如果当前所有缓冲行都将被删除且没有新热行加入，则删除所有缓冲行，且也不会修改当前滚动位置
		// 如果当前所有缓冲行都将被删除且有新热行加入，则删除所有缓冲行并加入新热行作为缓冲行，然后修改当前滚动位置
		this.currentTime = time;
		this.element.style.setProperty("--amll-player-time", `${time}`);
		const removedHotIds = new Set<number>();
		const removedIds = new Set<number>();
		const addedIds = new Set<number>();

		// 先检索当前已经超出时间范围的缓冲行，列入待删除集内
		this.hotLines.forEach((lastHotId) => {
			const line = this.processedLines[lastHotId];
			if (line.isBG) return;
			if (line) {
				const nextLine = this.processedLines[lastHotId + 1];
				if (nextLine?.isBG) {
					const startTime = Math.min(line.startTime, nextLine?.startTime);
					const endTime = Math.max(line.endTime, nextLine?.endTime);
					if (startTime > time || endTime <= time) {
						this.hotLines.delete(lastHotId);
						removedHotIds.add(lastHotId);
						this.hotLines.delete(lastHotId + 1);
						removedHotIds.add(lastHotId + 1);
						if (isSeek) {
							this.lyricLinesEl[lastHotId].disable();
							this.lyricLinesEl[lastHotId + 1].disable();
						}
					}
				} else if (line.startTime > time || line.endTime <= time) {
					this.hotLines.delete(lastHotId);
					removedHotIds.add(lastHotId);
					if (isSeek) this.lyricLinesEl[lastHotId].disable();
				}
			} else {
				this.hotLines.delete(lastHotId);
				removedHotIds.add(lastHotId);
				if (isSeek) this.lyricLinesEl[lastHotId].disable();
			}
		});
		this.bufferedLines.forEach((v) => {
			if (!this.hotLines.has(v)) {
				this.bufferedLines.delete(v);
				removedIds.add(v);
				if (isSeek) this.lyricLinesEl[v].disable();
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
		delta /= 1000;
		this.lyricLinesEl.forEach((line) => line.update(delta));
	}
	private posXSpringParams: Partial<SpringParams> = {
		mass: 1,
		damping: 10,
		stiffness: 100,
	};
	private posYSpringParams: Partial<SpringParams> = {
		mass: 1,
		damping: 15,
		stiffness: 100,
	};
	private scaleSpringParams: Partial<SpringParams> = {
		mass: 1,
		damping: 20,
		stiffness: 100,
	};
	setLinePosXSpringParams(params: Partial<SpringParams>) {
		this.posXSpringParams = {
			...this.posXSpringParams,
			...params,
		};
		this.lyricLinesEl.forEach((line) =>
			line.lineTransforms.posX.updateParams(this.posXSpringParams),
		);
	}
	setLinePosYSpringParams(params: Partial<SpringParams>) {
		this.posYSpringParams = {
			...this.posYSpringParams,
			...params,
		};
		this.lyricLinesEl.forEach((line) =>
			line.lineTransforms.posY.updateParams(this.posYSpringParams),
		);
	}
	setLineScaleSpringParams(params: Partial<SpringParams>) {
		this.scaleSpringParams = {
			...this.scaleSpringParams,
			...params,
		};
		this.lyricLinesEl.forEach((line) =>
			line.lineTransforms.scale.updateParams(this.scaleSpringParams),
		);
	}
	dispose(): void {
		this.element.remove();
		this.resizeObserver.disconnect();
		this.style.detach();
		this.lyricLinesEl.forEach((el) => el.dispose());
	}
}

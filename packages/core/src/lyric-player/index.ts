import type { Disposable, HasElement, LyricLine } from "../interfaces";
import styles from "../styles/lyric-player.module.css";
import { eqSet } from "../utils/eq-set";
import { BottomLineEl } from "./bottom-line";
import { DomLyricPlayer } from "./dom";
import { InterludeDots } from "./dom/interlude-dots";

export * from "./canvas";
export * from "./dom";

export const LyricPlayer = DomLyricPlayer;

/**
 * 歌词播放器的基类
 */
export abstract class LyricPlayerBase
	extends EventTarget
	implements HasElement, Disposable
{
	protected element: HTMLElement = document.createElement("div");

	protected currentTime = 0;
	private lyricLinesSize: WeakMap<LyricLineBase, [number, number]> =
		new WeakMap();
	protected currentLyricLines: LyricLine[] = [];
	// protected currentLyricLineObjects: LyricLineBase[] = [];
	protected processedLines: LyricLine[] = [];
	protected lyricLinesIndexes: WeakMap<LyricLineBase, number> = new WeakMap();
	protected hotLines: Set<number> = new Set();
	protected bufferedLines: Set<number> = new Set();
	protected isNonDynamic = false;
	protected scrollToIndex = 0;
	protected disableSpring = false;
	protected interludeDotsSize: [number, number] = [0, 0];
	protected interludeDots: InterludeDots = new InterludeDots();
	protected bottomLine: BottomLineEl = new BottomLineEl(this);
	protected enableBlur = true;
	protected enableScale = true;
	protected hidePassedLines = false;
	protected scrollBoundary = [0, 0];
	protected currentLyricLineObjects: LyricLineBase[] = [];
	protected isSeeking = false;
	protected lastCurrentTime = 0;
	protected alignAnchor: "top" | "bottom" | "center" = "center";
	protected alignPosition = 0.35;
	private scrollOffset = 0;
	readonly size: [number, number] = [0, 0];

	constructor() {
		super();
		this.element.classList.add(styles.lyricPlayer);
	}

	setIsSeeking(isSeeking: boolean) {
		this.isSeeking = isSeeking;
	}
	/**
	 * 设置是否隐藏已经播放过的歌词行，默认不隐藏
	 * @param hide 是否隐藏已经播放过的歌词行，默认不隐藏
	 */
	setHidePassedLines(hide: boolean) {
		this.hidePassedLines = hide;
		this.calcLayout();
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
	 * 设置目标歌词行的对齐方式，默认为 `center`
	 *
	 * - 设置成 `top` 的话将会向目标歌词行的顶部对齐
	 * - 设置成 `bottom` 的话将会向目标歌词行的底部对齐
	 * - 设置成 `center` 的话将会向目标歌词行的垂直中心对齐
	 * @param alignAnchor 歌词行对齐方式，详情见函数说明
	 */
	setAlignAnchor(alignAnchor: "top" | "bottom" | "center") {
		this.alignAnchor = alignAnchor;
	}
	/**
	 * 设置默认的歌词行对齐位置，相对于整个歌词播放组件的大小位置，默认为 `0.5`
	 * @param alignPosition 一个 `[0.0-1.0]` 之间的任意数字，代表组件高度由上到下的比例位置
	 */
	setAlignPosition(alignPosition: number) {
		this.alignPosition = alignPosition;
	}
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
			this.element.classList.remove(styles.disableSpring);
		} else {
			this.element.classList.add(styles.disableSpring);
		}
		this.calcLayout(true);
	}
	/**
	 * 获取当前是否启用了物理弹簧
	 * @returns 是否启用物理弹簧
	 */
	getEnableSpring() {
		return !this.disableSpring;
	}

	/**
	 * 获取当前播放时间里是否处于间奏区间
	 * 如果是则会返回单位为毫秒的始末时间
	 * 否则返回 undefined
	 *
	 * 这个只允许内部调用
	 * @returns [开始时间,结束时间,大概处于的歌词行ID,下一句是否为对唱歌词] 或 undefined 如果不处于间奏区间
	 */
	protected getCurrentInterlude():
		| [number, number, number, boolean]
		| undefined {
		if (this.bufferedLines.size > 0) return undefined;
		const currentTime = this.currentTime + 20;
		const i = this.scrollToIndex;
		if (i === 0) {
			if (this.processedLines[0]?.startTime) {
				if (this.processedLines[0].startTime > currentTime) {
					return [
						currentTime,
						Math.max(currentTime, this.processedLines[0].startTime - 250),
						-2,
						this.processedLines[0].isDuet,
					];
				}
				if (
					this.processedLines[1].startTime > currentTime &&
					this.processedLines[0].endTime < currentTime
				) {
					return [
						Math.max(this.processedLines[0].endTime, currentTime),
						this.processedLines[1].startTime,
						0,
						this.processedLines[1].isDuet,
					];
				}
			}
		} else if (
			this.processedLines[i]?.endTime &&
			this.processedLines[i + 1]?.startTime
		) {
			if (
				this.processedLines[i + 1].startTime > currentTime &&
				this.processedLines[i].endTime < currentTime
			) {
				return [
					Math.max(this.processedLines[i].endTime, currentTime),
					this.processedLines[i + 1].startTime,
					i,
					this.processedLines[i + 1].isDuet,
				];
			}
			if (
				this.processedLines[i + 2]?.startTime &&
				this.processedLines[i + 2].startTime > currentTime &&
				this.processedLines[i + 1].endTime < currentTime
			) {
				return [
					Math.max(this.processedLines[i + 1].endTime, currentTime),
					this.processedLines[i + 2].startTime,
					i + 1,
					this.processedLines[i + 2].isDuet,
				];
			}
		}
		return undefined;
	}
	/**
	 * 设置当前播放歌词，要注意传入后这个数组内的信息不得修改，否则会发生错误
	 * @param lines 歌词数组
	 * @param initialTime 初始时间，默认为 0
	 */
	setLyricLines(lines: LyricLine[], initialTime = 0) {
		for (const line of lines) {
			for (const word of line.words) {
				word.word = word.word.replace(/\s+/g, " ");
			}
		}
		this.lastCurrentTime = initialTime;
		this.currentTime = initialTime;
		this.processedLines = structuredClone(lines) as LyricLine[];

		this.isNonDynamic = true;
		for (const line of this.processedLines) {
			if (line.words.length > 1) {
				this.isNonDynamic = false;
				break;
			}
		}

		// 将行间有较短空隙的两个歌词行的结束时间拉长，与下一行歌词行的开始时间一致，以便于更好的显示
		this.processedLines.forEach((line, i, lines) => {
			const nextLine = lines[i + 1];
			const lastWord = line.words[line.words.length - 1];
			if (lastWord) {
				if (nextLine) {
					if (nextLine.startTime > line.endTime) {
						line.endTime = Math.min(line.endTime + 1500, nextLine.startTime);
					}
				} else {
					line.endTime = line.endTime + 1500;
				}
			}
		});

		// 让背景歌词和上一行歌词一同出现
		this.processedLines.forEach((line, i, lines) => {
			if (line.isBG) return;
			const nextLine = lines[i + 1];
			if (nextLine?.isBG) {
				nextLine.startTime = Math.min(nextLine.startTime, line.startTime);
			}
		});
		for (const line of this.currentLyricLineObjects) {
			line.dispose();
		}

		this.hotLines.clear();
		this.bufferedLines.clear();
		this.setCurrentTime(0, true);
		this.calcLayout(true, true);

		// this.interludeDots.setInterlude(undefined);
		// this.resetScroll();
		// this.currentLyricLineObjects.forEach((el, i) => {
		// 	this.element.appendChild(el.getElement());
		// 	this.lyricLinesIndexes.set(el, i);
		// 	el.markMaskImageDirty();
		// });
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

		// this.initializeSeeking = isSeek;
		// this.currentTime = time;
		// if (Math.abs(this.currentTime - this.lastCurrentTime) >= 100) {
		// 	this.initializeSeeking = true;
		// } else this.initializeSeeking = false;
		// if (!this.isPageVisible) return;
		// if (!this._getIsNonDynamic() && !this.supportMaskImage)
		// 	this.element.style.setProperty("--amll-player-time", `${time}`);
		// if (this.isScrolled) return;

		const removedHotIds = new Set<number>();
		const removedIds = new Set<number>();
		const addedIds = new Set<number>();

		// 先检索当前已经超出时间范围的缓冲行，列入待删除集内
		for (const lastHotId of this.hotLines) {
			const line = this.processedLines[lastHotId];
			if (line) {
				if (line.isBG) return;
				const nextLine = this.processedLines[lastHotId + 1];
				if (nextLine?.isBG) {
					const nextMainLine = this.processedLines[lastHotId + 2];
					const startTime = Math.min(line.startTime, nextLine?.startTime);
					const endTime = Math.min(
						Math.max(line.endTime, nextMainLine?.startTime ?? Number.MAX_VALUE),
						Math.max(line.endTime, nextLine?.endTime),
					);
					if (startTime > time || endTime <= time) {
						this.hotLines.delete(lastHotId);
						removedHotIds.add(lastHotId);
						this.hotLines.delete(lastHotId + 1);
						removedHotIds.add(lastHotId + 1);
						if (isSeek) {
							this.currentLyricLineObjects[lastHotId].disable();
							this.currentLyricLineObjects[lastHotId + 1].disable();
						}
					}
				} else if (line.startTime > time || line.endTime <= time) {
					this.hotLines.delete(lastHotId);
					removedHotIds.add(lastHotId);
					if (isSeek) this.currentLyricLineObjects[lastHotId].disable();
				}
			} else {
				this.hotLines.delete(lastHotId);
				removedHotIds.add(lastHotId);
				if (isSeek) this.currentLyricLineObjects[lastHotId].disable();
			}
		}
		this.processedLines.forEach((line, id, arr) => {
			if (!line.isBG && line.startTime <= time && line.endTime > time) {
				if (!this.hotLines.has(id)) {
					this.hotLines.add(id);
					addedIds.add(id);
					if (isSeek) this.currentLyricLineObjects[id].enable();
					if (arr[id + 1]?.isBG) {
						this.hotLines.add(id + 1);
						addedIds.add(id + 1);
						if (isSeek) this.currentLyricLineObjects[id + 1].enable();
					}
				}
			}
		});
		for (const v of this.bufferedLines) {
			if (!this.hotLines.has(v)) {
				removedIds.add(v);
				if (isSeek) this.currentLyricLineObjects[v].disable();
			}
		}
		if (isSeek) {
			if (this.bufferedLines.size > 0) {
				this.scrollToIndex = Math.min(...this.bufferedLines);
			} else {
				this.scrollToIndex = this.processedLines.findIndex(
					(line) => line.startTime >= time,
				);
			}
			this.bufferedLines.clear();
			for (const v of this.hotLines) {
				this.bufferedLines.add(v);
			}
			this.calcLayout(true);
		} else if (removedIds.size > 0 || addedIds.size > 0) {
			if (removedIds.size === 0 && addedIds.size > 0) {
				for (const v of addedIds) {
					this.bufferedLines.add(v);
					this.currentLyricLineObjects[v].enable();
				}
				this.scrollToIndex = Math.min(...this.bufferedLines);
				this.calcLayout();
			} else if (addedIds.size === 0 && removedIds.size > 0) {
				if (eqSet(removedIds, this.bufferedLines)) {
					for (const v of this.bufferedLines) {
						if (!this.hotLines.has(v)) {
							this.bufferedLines.delete(v);
							this.currentLyricLineObjects[v].disable();
						}
					}
					this.calcLayout();
				}
			} else {
				for (const v of addedIds) {
					this.bufferedLines.add(v);
					this.currentLyricLineObjects[v].enable();
				}
				for (const v of removedIds) {
					this.bufferedLines.delete(v);
					this.currentLyricLineObjects[v].disable();
				}
				if (this.bufferedLines.size > 0)
					this.scrollToIndex = Math.min(...this.bufferedLines);
				this.calcLayout();
			}
		}
		this.lastCurrentTime = time;
	}

	/**
	 * 重新布局定位歌词行的位置，调用完成后再逐帧调用 `update`
	 * 函数即可让歌词通过动画移动到目标位置。
	 *
	 * 函数有一个 `force` 参数，用于指定是否强制修改布局，也就是不经过动画直接调整元素位置和大小。
	 *
	 * 此函数还有一个 `reflow` 参数，用于指定是否需要重新计算布局
	 *
	 * 因为计算布局必定会导致浏览器重排布局，所以会大幅度影响流畅度和性能，故请只在以下情况下将其​设置为 true：
	 *
	 * 1. 歌词页面大小发生改变时（这个组件会自行处理）
	 * 2. 加载了新的歌词时（不论前后歌词是否完全一样）
	 * 3. 用户自行跳转了歌曲播放位置（不论距离远近）
	 *
	 * @param force 是否不经过动画直接修改布局定位
	 * @param reflow 是否进行重新布局（重新计算每行歌词大小）
	 */
	calcLayout(force?: boolean, reflow?: boolean) {
		if (reflow) {
			// this.emUnit = Number.parseFloat(getComputedStyle(this.element).fontSize);
			for (const el of this.currentLyricLineObjects) {
				const size: [number, number] = el.measureSize();
				this.lyricLinesSize.set(el, size);
			}
			this.interludeDotsSize[0] = this.interludeDots.getElement().clientWidth;
			this.interludeDotsSize[1] = this.interludeDots.getElement().clientHeight;

			this.bottomLine.lineSize = this.bottomLine.measureSize();
		}
		const interlude = this.getCurrentInterlude();
		let curPos = -this.scrollOffset;
		let targetAlignIndex = this.scrollToIndex;
		let interludeDuration = 0;
		if (interlude) {
			interludeDuration = interlude[1] - interlude[0];
			if (interludeDuration >= 4000) {
				const nextLine = this.currentLyricLineObjects[interlude[2] + 1];
				if (nextLine) {
					targetAlignIndex = interlude[2] + 1;
				}
			}
		} else {
			this.interludeDots.setInterlude(undefined);
		}
		const scrollOffset = this.currentLyricLineObjects
			.slice(0, targetAlignIndex)
			.reduce(
				(acc, el) =>
					acc +
					(el.getLine().isBG ? 0 : (this.lyricLinesSize.get(el)?.[1] ?? 0)),
				0,
			);
		this.scrollBoundary[0] = -scrollOffset;
		curPos -= scrollOffset;
		curPos += this.size[1] * this.alignPosition;
		const curLine = this.currentLyricLineObjects[targetAlignIndex];
		if (curLine) {
			const lineHeight = this.lyricLinesSize.get(curLine)?.[1] ?? 0;
			switch (this.alignAnchor) {
				case "bottom":
					curPos -= lineHeight;
					break;
				case "center":
					curPos -= lineHeight / 2;
					break;
				case "top":
					break;
			}
		}
		const latestIndex = Math.max(...this.bufferedLines);
		let delay = 0;
		let baseDelay = 0.05;
		let setDots = false;
		this.currentLyricLineObjects.forEach((el, i) => {
			const hasBuffered = this.bufferedLines.has(i);
			const isActive =
				hasBuffered || (i >= this.scrollToIndex && i < latestIndex);
			const line = el.getLine();
			let left = 24;
			if (line.isDuet) {
				left = this.size[0] - (this.lyricLinesSize.get(el)?.[0] ?? 0);
			}
			if (
				!setDots &&
				interludeDuration >= 4000 &&
				((i === this.scrollToIndex && interlude?.[2] === -2) ||
					i === this.scrollToIndex + 1)
			) {
				setDots = true;
				this.interludeDots.setTransform(24, curPos + 10);
				if (interlude) {
					this.interludeDots.setInterlude([interlude[0], interlude[1]]);
				}
				curPos += this.interludeDotsSize[1] + 40;
			}
			let targetOpacity: number;

			if (this.hidePassedLines) {
				if (i < (interlude ? interlude[2] + 1 : this.scrollToIndex)) {
					targetOpacity = 0;
				} else if (hasBuffered) {
					targetOpacity = 0.85;
				} else {
					targetOpacity = this.isNonDynamic ? 0.2 : 1;
				}
			} else {
				if (hasBuffered) {
					targetOpacity = 0.85;
				} else {
					targetOpacity = this.isNonDynamic ? 0.2 : 1;
				}
			}

			let blurLevel = 0;
			if (this.enableBlur) {
				if (isActive) {
					blurLevel = 0;
				} else {
					blurLevel = 1;
					if (i < this.scrollToIndex) {
						blurLevel += Math.abs(this.scrollToIndex - i) + 1;
					} else {
						blurLevel += Math.abs(
							i - Math.max(this.scrollToIndex, latestIndex),
						);
					}
				}
			}

			const SCALE_ASPECT = this.enableScale ? 97 : 100;

			el.setTransform(
				left,
				curPos,
				isActive ? 100 : line.isBG ? 75 : SCALE_ASPECT,
				targetOpacity,
				window.innerWidth <= 1024 ? blurLevel * 0.8 : blurLevel,
				force,
				delay,
			);
			if (line.isBG && isActive) {
				curPos += this.lyricLinesSize.get(el)?.[1] ?? 0;
			} else if (!line.isBG) {
				curPos += this.lyricLinesSize.get(el)?.[1] ?? 0;
			}
			if (curPos >= 0 && !this.isSeeking) {
				if (!line.isBG) delay += baseDelay;
				// if (i >= this.scrollToIndex - 1) baseDelay *= 1.05;
				// baseDelay = Math.min(baseDelay, 0.055);

				// delay += 0.05;

				// baseDelay = baseDelay > 0.15 ? 0 : baseDelay;
				// delay = (i - this.scrollToIndex) * 0.06;
				if (i >= this.scrollToIndex) baseDelay /= 1.05;
				// baseDelay = Math.max(baseDelay, 0.04);
			}
		});
		this.scrollBoundary[1] = curPos + this.scrollOffset - this.size[1] / 2;
		// console.groupEnd();
		this.bottomLine.setTransform(24, curPos, force, delay);
	}

	protected onResize() {}

	getElement(): HTMLElement {
		return this.element;
	}
	dispose(): void {
		this.element.remove();
	}
}

/**
 * 所有标准歌词行的基类
 * @internal
 */
export abstract class LyricLineBase extends EventTarget implements Disposable {
	abstract measureSize(): [number, number];
	abstract setLine(line: LyricLine): void;
	abstract getLine(): LyricLine;
	abstract enable(): void;
	abstract disable(): void;
	abstract resume(): void;
	abstract pause(): void;
	abstract setTransform(
		left?: number,
		top?: number,
		scale?: number,
		opacity?: number,
		blur?: number,
		force?: boolean,
		delay?: number,
	): void;
	abstract update(delta?: number): void;
	dispose() {}
}

import { LyricPlayer } from ".";
import { Disposable, HasElement, LyricLine, LyricWord } from "../interfaces";
import { createMatrix4, matrix4ToCSS, scaleMatrix4 } from "../utils/matrix";
import { Spring } from "../utils/spring";
import bezier from "bezier-easing";
import { WebAnimationSpring } from "../utils/wa-spring";

const CJKEXP = /^[\p{Unified_Ideograph}\u0800-\u9FFC]+$/u;

interface RealWord extends LyricWord {
	mainElement: HTMLSpanElement;
	subElements: HTMLSpanElement[];
	elementAnimations: Animation[];
	maskAnimations: Animation[];
	width: number;
	height: number;
	padding: number;
	shouldEmphasize: boolean;
}

const ANIMATION_FRAME_QUANTITY = 32;

const norNum = (min: number, max: number) => (x: number) =>
	Math.min(1, Math.max(0, (x - min) / (max - min)));
const EMP_EASING_MID = 0.5;
const beginNum = norNum(0, EMP_EASING_MID);
const endNum = norNum(EMP_EASING_MID, 1);

const makeEmpEasing = (mid: number) => {
	const bezIn = bezier(0.3, 0.5, 0.5, 1);
	const bezOut = bezier(0.28, 0.2, 0.5, 1);
	return (x: number) => (x < mid ? bezIn(beginNum(x)) : 1 - bezOut(endNum(x)));
};
const defaultEmpEasing = makeEmpEasing(EMP_EASING_MID);

let lastWord: RealWord | undefined;

// function generateFadeGradient(
// 	width: number,
// 	padding = 0,
// 	bright = "rgba(0,0,0,0.85)",
// 	dark = "rgba(0,0,0,0.25)",
// ): [string, number] {
// 	const totalAspect = 2 + width + padding;
// 	const widthInTotal = width / totalAspect;
// 	const leftPos = (1 - widthInTotal) / 2;
// 	return [
// 		`linear-gradient(to right,${bright} ${leftPos * 100}%,${dark} ${
// 			leftPos * 100
// 		}%,${bright} ${(leftPos + widthInTotal) * 100}%,${dark} ${
// 			(leftPos + widthInTotal) * 100
// 		}%)`,
// 		totalAspect,
// 	];
// }

function generateFadeGradient(
	width: number,
	padding = 0,
	bright = "rgba(0,0,0,0.85)",
	dark = "rgba(0,0,0,0.3)",
): [string, number] {
	const totalAspect = 2 + width + padding;
	const widthInTotal = width / totalAspect;
	const leftPos = (1 - widthInTotal) / 2;
	return [
		`linear-gradient(to right,${bright} ${leftPos * 100}%,${dark} ${
			(leftPos + widthInTotal) * 100
		}%)`,
		totalAspect,
	];
}

// 将输入的单词重新分组，之间没有空格的单词将会组合成一个单词数组
// 例如输入：["Life", " ", "is", " a", " su", "gar so", "sweet"]
// 应该返回：["Life", " ", "is", " a", [" su", "gar"], "so", "sweet"]
function chunkAndSplitLyricWords(
	words: LyricWord[],
): (LyricWord | LyricWord[])[] {
	const resplitedWords: LyricWord[] = [];

	for (const w of words) {
		const realLength = w.word.replace(/\s/g, "").length;
		const splited = w.word.split(" ").filter((v) => v.trim().length > 0);
		if (splited.length > 1) {
			if (w.word.startsWith(" ")) {
				resplitedWords.push({
					word: " ",
					startTime: 0,
					endTime: 0,
				});
			}
			let charPos = 0;
			for (const s of splited) {
				const word: LyricWord = {
					word: s,
					startTime:
						w.startTime + (charPos / realLength) * (w.endTime - w.startTime),
					endTime:
						w.startTime +
						((charPos + s.length) / realLength) * (w.endTime - w.startTime),
				};
				resplitedWords.push(word);
				resplitedWords.push({
					word: " ",
					startTime: 0,
					endTime: 0,
				});
				charPos += s.length;
			}
			if (!w.word.endsWith(" ")) {
				resplitedWords.pop();
			}
		} else {
			resplitedWords.push({
				...w,
			});
		}
	}

	let wordChunk: string[] = [];
	let wChunk: LyricWord[] = [];
	const result: (LyricWord | LyricWord[])[] = [];

	for (const w of resplitedWords) {
		const word = w.word;
		wordChunk.push(word);
		wChunk.push(w);
		if (word.length > 0 && word.trim().length === 0) {
			wordChunk.pop();
			wChunk.pop();
			if (wChunk.length === 1) {
				result.push(wChunk[0]);
			} else if (wChunk.length > 1) {
				result.push(wChunk);
			}
			result.push(w);
			wordChunk = [];
			wChunk = [];
		} else if (
			!/^\s*[^\s]*\s*$/.test(wordChunk.join("")) ||
			CJKEXP.test(word)
		) {
			wordChunk.pop();
			wChunk.pop();
			if (wChunk.length === 1) {
				result.push(wChunk[0]);
			} else if (wChunk.length > 1) {
				result.push(wChunk);
			}
			wordChunk = [word];
			wChunk = [w];
		}
	}

	if (wChunk.length === 1) {
		result.push(wChunk[0]);
	} else {
		result.push(wChunk);
	}

	return result;
}

// 果子在对辉光效果的解释是一种强调（emphasized）效果
// 条件是一个单词时长大于等于 1s 且长度小于等于 7
export function shouldEmphasize(word: LyricWord): boolean {
	return (
		word.endTime - word.startTime >= 1000 &&
		word.word.trim().length <= 7 &&
		word.word.trim().length > 1
	);
}

export class RawLyricLineMouseEvent extends MouseEvent {
	constructor(
		public readonly line: LyricLineEl,
		event: MouseEvent,
	) {
		super(event.type, event);
	}
}

type MouseEventMap = {
	[evt in keyof HTMLElementEventMap]: HTMLElementEventMap[evt] extends MouseEvent
		? evt
		: never;
};
type MouseEventTypes = MouseEventMap[keyof MouseEventMap];
type MouseEventListener = (
	this: LyricLineEl,
	ev: RawLyricLineMouseEvent,
) => void;

export class LyricLineEl extends EventTarget implements HasElement, Disposable {
	private lyricAdvanceDynamicLyricTime = true;
	private element: HTMLElement = document.createElement("div");
	private left = 0;
	private top = 0;
	private scale = 1;
	private blur = 0;
	private delay = 0;
	private splittedWords: RealWord[] = [];
	// 由 LyricPlayer 来设置
	lineSize: number[] = [0, 0];
	readonly lineTransforms = {
		posX: new Spring(0),
		posY: new Spring(0),
		scale: new Spring(1),
	};

	/**
	 * 设置是否应用提前歌词行时序，默认为 `true`
	 */
	setLyricAdvanceDynamicLyricTime(enable: boolean) {
		this.lyricAdvanceDynamicLyricTime = enable;
	}

	constructor(
		private lyricPlayer: LyricPlayer,
		private lyricLine: LyricLine = {
			words: [],
			translatedLyric: "",
			romanLyric: "",
			startTime: 0,
			endTime: 0,
			isBG: false,
			isDuet: false,
		},
	) {
		super();
		this._prevParentEl = lyricPlayer.getElement();
		this.element.setAttribute(
			"class",
			this.lyricPlayer.style.classes.lyricLine,
		);
		if (this.lyricLine.isBG) {
			this.element.classList.add(this.lyricPlayer.style.classes.lyricBgLine);
		}
		if (this.lyricLine.isDuet) {
			this.element.classList.add(this.lyricPlayer.style.classes.lyricDuetLine);
		}
		this.element.appendChild(document.createElement("div")); // 歌词行
		this.element.appendChild(document.createElement("div")); // 翻译行
		this.element.appendChild(document.createElement("div")); // 音译行
		const main = this.element.children[0] as HTMLDivElement;
		const trans = this.element.children[1] as HTMLDivElement;
		const roman = this.element.children[2] as HTMLDivElement;
		main.setAttribute("class", this.lyricPlayer.style.classes.lyricMainLine);
		trans.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine);
		roman.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine);
		this.rebuildElement();
		this.rebuildStyle();
	}
	private listenersMap = new Map<string, Set<MouseEventListener>>();
	private readonly onMouseEvent = (e: MouseEvent) => {
		const wrapped = new RawLyricLineMouseEvent(this, e);
		for (const listener of this.listenersMap.get(e.type) ?? []) {
			listener.call(this, wrapped);
		}
		if (!this.dispatchEvent(wrapped) || wrapped.defaultPrevented) {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			return false;
		}
	};

	addMouseEventListener(
		type: MouseEventTypes,
		callback: MouseEventListener | null,
		options?: boolean | AddEventListenerOptions | undefined,
	): void {
		if (callback) {
			const listeners = this.listenersMap.get(type) ?? new Set();
			if (listeners.size === 0)
				this.element.addEventListener(type, this.onMouseEvent, options);
			listeners.add(callback);
			this.listenersMap.set(type, listeners);
		}
	}

	removeMouseEventListener(
		type: MouseEventTypes,
		callback: MouseEventListener | null,
		options?: boolean | EventListenerOptions | undefined,
	): void {
		if (callback) {
			const listeners = this.listenersMap.get(type);
			if (listeners) {
				listeners.delete(callback);
				if (listeners.size === 0)
					this.element.removeEventListener(type, this.onMouseEvent, options);
			}
		}
	}

	areWordsOnSameLine(word1: RealWord, word2: RealWord) {
		if (word1?.mainElement && word2?.mainElement) {
			const word1el = word1.mainElement;
			const word2el = word2.mainElement;

			const rect1 = word1el.getBoundingClientRect();
			const rect2 = word2el.getBoundingClientRect();

			// 检查两个单词的顶部距离是否相等（或者差值很小）
			const topDifference = Math.abs(rect1.top - rect2.top);

			// 如果顶部距离相差很小，可以认为它们在同一行上
			// console.log(word1.word, word2.word, topDifference);
			return topDifference < 10;
		}

		return true;
	}

	private isEnabled = false;
	private hasFaded = false;
	enable(maskAnimationTime = this.lyricLine.startTime) {
		this.isEnabled = true;
		this.hasFaded = false;
		this.element.classList.add("active");
		const main = this.element.children[0] as HTMLDivElement;
		for (const word of this.splittedWords) {
			for (const a of word.elementAnimations) {
				a.currentTime = 0;
				a.playbackRate = 1;
				a.play();
			}
			for (const a of word.maskAnimations) {
				a.currentTime = Math.min(
					this.totalDuration,
					Math.max(0, maskAnimationTime - this.lyricLine.startTime),
				);
				a.playbackRate = 1;
				a.play();
			}
		}
		main.classList.add("active");
	}
	disable(maskAnimationTime = 0) {
		this.isEnabled = false;
		this.hasFaded = true;
		this.element.classList.remove("active");
		const main = this.element.children[0] as HTMLDivElement;
		let i = 0;
		for (const word of this.splittedWords) {
			for (const a of word.elementAnimations) {
				if (
					a.id === "float-word" ||
					a.id.includes("emphasize-word-float-only")
				) {
					a.playbackRate = -1;
					a.play();
				}
			}
			for (const a of word.maskAnimations) {
				if (this.lyricAdvanceDynamicLyricTime) {
					if (maskAnimationTime - this.lyricLine.startTime <= 0) {
						this.hasFaded = false;
					}
					const start = word.startTime - this.lyricLine.startTime;
					const current = maskAnimationTime - this.lyricLine.startTime;
					a.finished.then(() => {
						// a.currentTime = 0;
						a.pause();
					});
					if (maskAnimationTime - this.lyricLine.startTime <= 0) {
						a.currentTime = 0;
						a.pause();
					} else if (
						i === this.splittedWords.length - 1 &&
						!this.areWordsOnSameLine(
							this.splittedWords[i - 1],
							this.splittedWords[i],
						) &&
						current < start - 300
					) {
						a.currentTime = start;
						a.playbackRate = 1;
					} else {
						a.currentTime = Math.min(
							this.totalDuration,
							Math.max(0, maskAnimationTime - this.lyricLine.startTime),
						);
						a.playbackRate = 2;
					}
				} else {
					a.currentTime = Math.min(
						this.totalDuration,
						Math.max(0, maskAnimationTime - this.lyricLine.startTime),
					);
					a.pause();
				}
			}
			i++;
		}
		main.classList.remove("active");
	}
	resume(currentTime = 0) {
		if (!this.isEnabled) return;
		for (const word of this.splittedWords) {
			for (const a of word.elementAnimations) {
				if (
					this.splittedWords.indexOf(lastWord) <
					this.splittedWords.indexOf(word)
				) {
					console.log(word.word);
					a.play();
				}
			}
			for (const a of word.maskAnimations) {
				if (
					this.splittedWords.indexOf(lastWord) <
					this.splittedWords.indexOf(word)
				) {
					a.play();
				}
			}
		}
	}
	pause(currentTime = 0) {
		if (!this.isEnabled) return;
		for (const word of this.splittedWords) {
			for (const a of word.elementAnimations) {
				if (word.startTime >= currentTime) {
					a.pause();
				} else {
					lastWord = word;
				}
			}
			for (const a of word.maskAnimations) {
				if (word.startTime >= currentTime) {
					a.pause();
				} else {
					lastWord = word;
				}
			}
		}
	}
	setMaskAnimationState(maskAnimationTime = 0) {
		const t = maskAnimationTime - this.lyricLine.startTime;
		for (const word of this.splittedWords) {
			for (const a of word.maskAnimations) {
				a.currentTime = Math.min(this.totalDuration, Math.max(0, t));
				a.playbackRate = 1;
				if (t >= 0 && t < this.totalDuration) a.play();
				else a.pause();
			}
		}
	}
	measureSize(): [number, number] {
		this.hasFaded = false;
		if (this._hide) {
			if (this._prevParentEl) {
				this._prevParentEl.appendChild(this.element);
			}
			this.element.style.display = "";
			this.element.style.visibility = "hidden";
		}
		const size: [number, number] = [
			this.element.clientWidth,
			this.element.clientHeight,
		];
		if (this._hide) {
			if (this._prevParentEl) {
				this.element.remove();
			}
			this.element.style.display = "none";
			this.element.style.visibility = "";
		}
		return size;
	}
	setLine(line: LyricLine) {
		this.lyricLine = line;
		if (this.lyricLine.isBG) {
			this.element.classList.add(this.lyricPlayer.style.classes.lyricBgLine);
		} else {
			this.element.classList.remove(this.lyricPlayer.style.classes.lyricBgLine);
		}
		if (this.lyricLine.isDuet) {
			this.element.classList.add(this.lyricPlayer.style.classes.lyricDuetLine);
		} else {
			this.element.classList.remove(
				this.lyricPlayer.style.classes.lyricDuetLine,
			);
		}
		this.rebuildElement();
		this.rebuildStyle();
	}
	getLine() {
		return this.lyricLine;
	}
	private _hide = true;
	private _prevParentEl: HTMLElement | null = null;
	private lastStyle = "";
	show() {
		this._hide = false;
		if (this._prevParentEl) {
			this._prevParentEl.appendChild(this.element);
			this._prevParentEl = null;
		}
		this.rebuildStyle();
	}
	hide() {
		this._hide = true;
		if (this.element.parentElement) {
			this._prevParentEl = this.element.parentElement;
			this.element.remove();
		}
		this.rebuildStyle();
	}
	rebuildStyle() {
		if (this._hide) {
			if (this.lastStyle !== "display:none;transform:translate(0,-10000px);") {
				this.lastStyle = "display:none;transform:translate(0,-10000px);";
				this.element.setAttribute(
					"style",
					"display:none;transform:translate(0,-10000px);",
				);
			}
			return;
		}
		let style = "";
		// if (this.lyricPlayer.getEnableSpring()) {
		style += `transform:translate(${this.lineTransforms.posX
			.getCurrentPosition()
			.toFixed(1)}px,${this.lineTransforms.posY
			.getCurrentPosition()
			.toFixed(1)}px) scale(${this.lineTransforms.scale
			.getCurrentPosition()
			.toFixed(4)});`;
		if (!this.lyricPlayer.getEnableSpring() && this.isInSight) {
			style += `transition-delay:${this.delay}ms;`;
		}
		style += `filter:blur(${Math.min(32, this.blur)}px);`;
		if (style !== this.lastStyle) {
			this.lastStyle = style;
			this.element.setAttribute("style", style);
		}
	}
	rebuildElement() {
		this.disposeElements();
		const main = this.element.children[0] as HTMLDivElement;
		const trans = this.element.children[1] as HTMLDivElement;
		const roman = this.element.children[2] as HTMLDivElement;
		// 如果是非动态歌词，那么就不需要分词了
		if (this.lyricPlayer._getIsNonDynamic()) {
			main.innerText = this.lyricLine.words.map((w) => w.word).join("");
			trans.innerText = this.lyricLine.translatedLyric;
			roman.innerText = this.lyricLine.romanLyric;
			return;
		}
		const chunkedWords = chunkAndSplitLyricWords(this.lyricLine.words);
		main.innerHTML = "";
		for (const chunk of chunkedWords) {
			if (Array.isArray(chunk)) {
				// 多个没有空格的单词组合成的一个单词数组
				if (chunk.length === 0) continue;
				const merged = chunk.reduce(
					(a, b) => {
						a.endTime = Math.max(a.endTime, b.endTime);
						a.startTime = Math.min(a.startTime, b.startTime);
						a.word += b.word;
						return a;
					},
					{ word: "", startTime: Infinity, endTime: -Infinity },
				);
				const emp = chunk
					.map((word) => shouldEmphasize(word))
					.reduce((a, b) => a || b, shouldEmphasize(merged));
				const wrapperWordEl = document.createElement("span");
				wrapperWordEl.classList.add("emphasize-wrapper");
				const characterElements: HTMLElement[] = [];
				for (const word of chunk) {
					const mainWordEl = document.createElement("span");
					// const mainWordFloatAnimation = this.initFloatAnimation(
					// 	merged,
					// 	mainWordEl,
					// );
					if (shouldEmphasize(merged)) {
						mainWordEl.classList.add("emphasize");
						const charEls: HTMLSpanElement[] = [];
						for (const char of word.word.trim().split("")) {
							const charEl = document.createElement("span");
							charEl.innerText = char;
							charEls.push(charEl);
							characterElements.push(charEl);
							mainWordEl.appendChild(charEl);
						}
						const realWord: RealWord = {
							...word,
							mainElement: mainWordEl,
							subElements: charEls,
							elementAnimations: [this.initFloatAnimation(merged, mainWordEl)],
							maskAnimations: [],
							width: 0,
							height: 0,
							padding: 0,
							shouldEmphasize: emp,
						};
						this.splittedWords.push(realWord);
					} else {
						mainWordEl.innerText = word.word;
						this.splittedWords.push({
							...word,
							mainElement: mainWordEl,
							subElements: [],
							elementAnimations: [this.initFloatAnimation(word, mainWordEl)],
							maskAnimations: [],
							width: 0,
							height: 0,
							padding: 0,
							shouldEmphasize: emp,
						});
					}
					wrapperWordEl.appendChild(mainWordEl);
				}
				if (shouldEmphasize(merged)) {
					this.splittedWords[
						this.splittedWords.length - 1
					].elementAnimations.push(
						...this.initEmphasizeAnimation(
							merged,
							characterElements,
							merged.endTime - merged.startTime,
							merged.startTime - this.lyricLine.startTime,
						),
					);
				}
				if (merged.word.trimStart() !== merged.word) {
					main.appendChild(document.createTextNode(" "));
				}
				main.appendChild(wrapperWordEl);
				if (merged.word.trimEnd() !== merged.word) {
					main.appendChild(document.createTextNode(" "));
				}
			} else if (chunk.word.trim().length === 0) {
				// 纯空格
				main.appendChild(document.createTextNode(" "));
			} else {
				// 单个单词
				const emp = shouldEmphasize(chunk);
				const mainWordEl = document.createElement("span");
				const realWord: RealWord = {
					...chunk,
					mainElement: mainWordEl,
					subElements: [],
					elementAnimations: [this.initFloatAnimation(chunk, mainWordEl)],
					maskAnimations: [],
					width: 0,
					height: 0,
					padding: 0,
					shouldEmphasize: emp,
				};
				if (shouldEmphasize(chunk)) {
					mainWordEl.classList.add("emphasize");
					const charEls: HTMLSpanElement[] = [];
					for (const char of chunk.word.trim().split("")) {
						const charEl = document.createElement("span");
						charEl.innerText = char;
						charEls.push(charEl);
						mainWordEl.appendChild(charEl);
					}
					realWord.subElements = charEls;
					const duration = Math.abs(realWord.endTime - realWord.startTime);
					realWord.elementAnimations.push(
						...this.initEmphasizeAnimation(
							chunk,
							charEls,
							duration,
							realWord.startTime - this.lyricLine.startTime,
						),
					);
					// realWord.elementAnimations = this.initEmphasizeAnimation(realWord);
				} else {
					mainWordEl.innerText = chunk.word.trim();
				}
				if (chunk.word.trimStart() !== chunk.word) {
					main.appendChild(document.createTextNode(" "));
				}
				main.appendChild(mainWordEl);
				if (chunk.word.trimEnd() !== chunk.word) {
					main.appendChild(document.createTextNode(" "));
				}
				this.splittedWords.push(realWord);
			}
		}
		trans.innerText = this.lyricLine.translatedLyric;
		roman.innerText = this.lyricLine.romanLyric;
	}
	private initFloatAnimation(word: LyricWord, wordEl: HTMLSpanElement) {
		const delay = word.startTime - this.lyricLine.startTime;
		const duration = Math.max(1000, word.endTime - word.startTime);
		let up = 0.05;
		if (this.lyricLine.isBG) {
			up *= 2;
		}
		if (shouldEmphasize(word)) {
			up = 0;
		}
		const a = wordEl.animate(
			[
				{
					transform: "translateY(0px)",
				},
				{
					transform: `translateY(${-up}em)`,
				},
			],
			{
				duration: Number.isFinite(duration) ? duration : 0,
				delay: Number.isFinite(delay) ? delay : 0,
				id: "float-word",
				composite: "add",
				fill: "both",
				easing: "ease-out",
			},
		);
		a.pause();
		return a;
	}
	// 按照原 Apple Music 参考，强调效果只应用缩放、轻微左右位移和辉光效果，原主要的悬浮位移效果不变
	// 为了避免产生锯齿抖动感，使用 matrix3d 来实现缩放和位移
	private initEmphasizeAnimation(
		word: LyricWord,
		characterElements: HTMLElement[],
		duration: number,
		delay: number,
	): Animation[] {
		const de = Math.max(0, delay);
		let du = Math.max(1000, duration);

		let result: Animation[] = [];

		let amount = du / 2000;
		amount = amount > 1 ? Math.sqrt(amount) : amount ** 3;
		let blur = du / 3000;
		blur = blur > 1 ? Math.sqrt(blur) : blur ** 3;
		amount *= 0.6;
		blur *= 0.8;
		if (
			this.lyricLine.words.length > 0 &&
			word.word.includes(
				this.lyricLine.words[this.lyricLine.words.length - 1].word,
			)
		) {
			amount *= 2.0;
			blur *= 1.5;
			du *= 1.2;
		}
		amount = Math.min(1.2, amount);
		blur = Math.min(0.8, blur);
		// if (du >= 1200 && du < 2000) {
		// 	amount = 0.7;
		// 	blur = 0.2;
		// } else if (du >= 2000 && du < 3000) {
		// 	amount = 0.9;
		// 	blur = 0.4;
		// } else if (du >= 3000 && du < 4000) {
		// 	amount = 1.1;
		// 	blur = 0.6;
		// } else if (du >= 4000) {
		// 	amount = 1.2;
		// 	blur = 0.8;
		// }
		// console.log(word.word + " " + word.word.trim().length);
		// const animateDu = Number.isFinite(du) ? du * (word.word.trim().length >= 4 ? 1. : 1.5) : 0;
		const animateDu = Number.isFinite(du) ? du : 0;
		const empEasing = makeEmpEasing(EMP_EASING_MID);
		result = characterElements.flatMap((el, i, arr) => {
			const wordDe = de + (du / 2.5 / arr.length) * i;
			const result: Animation[] = [];

			const frames: Keyframe[] = new Array(ANIMATION_FRAME_QUANTITY)
				.fill(0)
				.map((_, j) => {
					const x = (j + 1) / ANIMATION_FRAME_QUANTITY;
					const transX = empEasing(x);
					// const transX = Math.sin(x * Math.PI);
					// transX = x < EMP_EASING_MID ? transX : Math.max(transX, 0);
					const glowLevel = empEasing(x) * blur;
					// const floatLevel =
					// 	Math.max(0, x < EMP_EASING_MID ? y : y - 0.5);

					const mat = scaleMatrix4(createMatrix4(), 1 + transX * 0.1 * amount);

					return {
						offset: x,
						transform: `${matrix4ToCSS(mat, 4)} translate(${
							-transX * 0.05 * amount * ((arr.length - i) / arr.length) ** 2
						}em, ${-transX * 0.03 * amount}em)`,
						textShadow: `0 0 ${Math.min(
							0.3,
							blur * 0.4,
						)}em rgba(255, 255, 255, ${glowLevel})`,
					};
				});
			const glow = el.animate(frames, {
				duration: animateDu,
				delay: Number.isFinite(wordDe) ? wordDe : 0,
				id: `emphasize-word-${el.innerText}-${i}`,
				iterations: 1,
				composite: "replace",
				easing: "linear",
				fill: "both",
			});
			glow.onfinish = () => {
				glow.pause();
			};
			glow.pause();
			result.push(glow);

			const floatFrame: Keyframe[] = new Array(ANIMATION_FRAME_QUANTITY)
				.fill(0)
				.map((_, j) => {
					const x = (j + 1) / ANIMATION_FRAME_QUANTITY;
					let y = Math.sin(x * Math.PI);
					y = x < 0.5 ? y : Math.max(y, 1.0);
					if (this.lyricLine.isBG) {
						y *= 2;
					}

					return {
						offset: x,
						transform: `translateY(${-y * 0.05}em)`,
					};
				});
			const float = el.animate(floatFrame, {
				duration: animateDu * 1.4,
				delay: Number.isFinite(wordDe) ? wordDe - 400 : 0,
				id: "float-word",
				iterations: 1,
				composite: "add",
				easing: "ease-in-out",
				fill: "both",
			});
			float.onfinish = () => {
				float.pause();
			};
			float.pause();
			result.push(float);

			return result;
		});

		return result;
	}
	private get totalDuration() {
		return (
			this.lyricLine.endTime +
			(this.lyricAdvanceDynamicLyricTime ? 500 : 0) -
			this.lyricLine.startTime
		);
	}
	updateMaskImage() {
		if (this._hide) {
			if (this._prevParentEl) {
				this._prevParentEl.appendChild(this.element);
			}
			this.element.style.display = "";
			this.element.style.visibility = "hidden";
		}
		for (const word of this.splittedWords) {
			const el = word.mainElement;
			if (el) {
				word.padding = parseFloat(getComputedStyle(el).paddingLeft);
				word.width = el.clientWidth - word.padding * 2;
				word.height = el.clientHeight - word.padding * 2;
			} else {
				word.width = 0;
				word.height = 0;
				word.padding = 0;
			}
		}
		if (this.lyricPlayer.supportMaskImage) {
			this.generateWebAnimationBasedMaskImage();
		} else {
			this.generateCalcBasedMaskImage();
		}
		if (this._hide) {
			if (this._prevParentEl) {
				this.element.remove();
			}
			this.element.style.display = "none";
			this.element.style.visibility = "";
		}
	}
	private generateCalcBasedMaskImage() {
		for (const word of this.splittedWords) {
			const wordEl = word.mainElement;
			if (wordEl) {
				word.width = wordEl.clientWidth;
				word.height = wordEl.clientHeight;
				const fadeWidth = word.height * this.lyricPlayer.wordFadeWidth;
				const [maskImage, totalAspect] = generateFadeGradient(
					fadeWidth / word.width,
				);
				const totalAspectStr = `${totalAspect * 100}% 100%`;
				if (this.lyricPlayer.supportMaskImage) {
					wordEl.style.maskImage = maskImage;
					wordEl.style.maskRepeat = "no-repeat";
					wordEl.style.maskOrigin = "left";
					wordEl.style.maskSize = totalAspectStr;
				} else {
					wordEl.style.webkitMaskImage = maskImage;
					wordEl.style.webkitMaskRepeat = "no-repeat";
					wordEl.style.webkitMaskOrigin = "left";
					wordEl.style.webkitMaskSize = totalAspectStr;
				}
				const w = word.width + fadeWidth;
				const maskPos = `clamp(${-w}px,calc(${-w}px + (var(--amll-player-time) - ${
					word.startTime
				})*${
					w / Math.abs(word.endTime - word.startTime)
				}px),0px) 0px, left top`;
				wordEl.style.maskPosition = maskPos;
				wordEl.style.webkitMaskPosition = maskPos;
			}
		}
	}
	private generateWebAnimationBasedMaskImage() {
		const totalDuration = this.totalDuration;
		this.splittedWords.forEach((word, i) => {
			const wordEl = word.mainElement;
			if (wordEl) {
				const fadeWidth = word.height * this.lyricPlayer.wordFadeWidth;
				const [maskImage, totalAspect] = generateFadeGradient(
					fadeWidth / (word.width + word.padding * 2),
				);
				const totalAspectStr = `${totalAspect * 100}% 100%`;
				if (this.lyricPlayer.supportMaskImage) {
					wordEl.style.maskImage = maskImage;
					wordEl.style.maskRepeat = "no-repeat";
					wordEl.style.maskOrigin = "left";
					wordEl.style.maskSize = totalAspectStr;
				} else {
					wordEl.style.webkitMaskImage = maskImage;
					wordEl.style.webkitMaskRepeat = "no-repeat";
					wordEl.style.webkitMaskOrigin = "left";
					wordEl.style.webkitMaskSize = totalAspectStr;
				}
				// 为了尽可能将渐变动画在相连的每个单词间近似衔接起来
				// 要综合每个单词的效果时间和间隙生成动画帧数组
				const widthBeforeSelf =
					this.splittedWords.slice(0, i).reduce((a, b) => a + b.width, 0) +
					(this.splittedWords[0] ? fadeWidth : 0);
				const minOffset = -(word.width + word.padding * 2 + fadeWidth);
				const clampOffset = (x: number) => Math.max(minOffset, Math.min(0, x));
				let curPos = -widthBeforeSelf - word.width - word.padding - fadeWidth;
				let timeOffset = 0;
				const frames: Keyframe[] = [];
				let lastPos = curPos;
				let lastTime = 0;
				const pushFrame = () => {
					const easing = "cubic-bezier(.33,.12,.83,.9)";
					const moveOffset = curPos - lastPos;
					const time = Math.max(0, Math.min(1, timeOffset));
					const duration = time - lastTime;
					const d = Math.abs(duration / moveOffset);
					// 因为有可能会和之前的动画有边界
					if (curPos > minOffset && lastPos < minOffset) {
						const staticTime = Math.abs(lastPos - minOffset) * d;
						const value = `${clampOffset(lastPos)}px 0`;
						const frame: Keyframe = {
							offset: lastTime + staticTime,
							maskPosition: value,
							easing: easing,
						};
						frames.push(frame);
					}
					if (curPos > 0 && lastPos < 0) {
						const staticTime = Math.abs(lastPos) * d;
						const value = `${clampOffset(curPos)}px 0`;
						const frame: Keyframe = {
							offset: lastTime + staticTime,
							maskPosition: value,
							easing: easing,
						};
						frames.push(frame);
					}
					const value = `${clampOffset(curPos)}px 0`;
					const frame: Keyframe = {
						offset: time,
						maskPosition: value,
						easing: easing,
					};
					frames.push(frame);
					lastPos = curPos;
					lastTime = time;
				};
				pushFrame();
				let lastTimeStamp = 0;
				this.splittedWords.forEach((otherWord, j) => {
					// 停顿
					{
						const curTimeStamp = otherWord.startTime - this.lyricLine.startTime;
						const staticDuration = curTimeStamp - lastTimeStamp;
						timeOffset += staticDuration / totalDuration;
						if (staticDuration > 0) pushFrame();
						lastTimeStamp = curTimeStamp;
					}
					// 移动
					{
						const fadeDuration = otherWord.endTime - otherWord.startTime;
						timeOffset += fadeDuration / totalDuration;
						curPos += otherWord.width;
						if (j === 0) {
							curPos += fadeWidth * 1.5;
						}
						if (j === this.splittedWords.length - 1) {
							curPos += fadeWidth * 0.5;
						}
						if (fadeDuration > 0) pushFrame();
						lastTimeStamp += fadeDuration;
					}
				});
				for (const a of word.maskAnimations) {
					a.cancel();
				}
				try {
					const ani = wordEl.animate(frames, {
						duration: totalDuration || 1,
						id: `fade-word-${word.word}-${i}`,
						fill: "both",
					});
					ani.pause();
					word.maskAnimations = [ani];
				} catch (err) {
					console.warn("应用渐变动画发生错误", frames, totalDuration, err);
				}
			}
		});
	}
	getElement() {
		return this.element;
	}
	setTransform(
		left: number = this.left,
		top: number = this.top,
		scale: number = this.scale,
		opacity = 1,
		blur = 0,
		force = false,
		delay = 0,
		currentAbove = true,
	) {
		const roundedBlur = Math.round(blur);
		const beforeInSight = this.isInSight;
		const enableSpring = this.lyricPlayer.getEnableSpring();
		this.left = left;
		this.top = top;
		this.scale = scale;
		this.delay = (delay * 1000) | 0;
		const main = this.element.children[0] as HTMLDivElement;
		const trans = this.element.children[1] as HTMLDivElement;
		const roman = this.element.children[2] as HTMLDivElement;
		main.style.opacity = `${
			opacity *
			(!this.hasFaded ? 1 : this.lyricPlayer._getIsNonDynamic() ? 1 : 0.3)
		}`;
		trans.style.opacity = `${opacity / 2}`;
		roman.style.opacity = `${opacity / 2}`;
		if (force || !enableSpring) {
			this.blur = Math.min(32, roundedBlur);
			if (force)
				this.element.classList.add(
					this.lyricPlayer.style.classes.tmpDisableTransition,
				);
			// this.lineWebAnimationTransforms.posX.setTargetPosition(left);
			// this.lineWebAnimationTransforms.posY.setTargetPosition(top);
			// this.lineWebAnimationTransforms.scale.setTargetPosition(scale);
			this.lineTransforms.posX.setPosition(left);
			this.lineTransforms.posY.setPosition(top);
			this.lineTransforms.scale.setPosition(scale);
			if (!enableSpring) {
				const afterInSight = this.isInSight;
				if (beforeInSight || afterInSight) {
					this.show();
				} else {
					this.hide();
				}
			} else this.rebuildStyle();
			if (force)
				requestAnimationFrame(() => {
					this.element.classList.remove(
						this.lyricPlayer.style.classes.tmpDisableTransition,
					);
				});
		} else {
			// this.lineWebAnimationTransforms.posX.stop();
			// this.lineWebAnimationTransforms.posY.stop();
			// this.lineWebAnimationTransforms.scale.stop();
			this.lineTransforms.posX.setTargetPosition(left, delay);
			this.lineTransforms.posY.setTargetPosition(top, delay);
			this.lineTransforms.scale.setTargetPosition(scale);
			if (this.blur !== Math.min(32, roundedBlur)) {
				this.blur = Math.min(32, roundedBlur);
				this.element.style.filter = `blur(${Math.min(32, roundedBlur)}px)`;
			}
		}
	}
	update(delta = 0) {
		if (!this.lyricPlayer.getEnableSpring()) return;
		this.lineTransforms.posX.update(delta);
		this.lineTransforms.posY.update(delta);
		this.lineTransforms.scale.update(delta);
		if (this.isInSight) {
			this.show();
		} else {
			this.hide();
		}
	}

	_getDebugTargetPos(): string {
		return `[位移: ${this.left}, ${this.top}; 缩放: ${this.scale}; 延时: ${this.delay}]`;
	}

	get isInSight() {
		const l = this.lineTransforms.posX.getCurrentPosition();
		const t = this.lineTransforms.posY.getCurrentPosition();
		const r = l + this.lineSize[0];
		const b = t + this.lineSize[1];
		const pr = this.lyricPlayer.size[0];
		const pb = this.lyricPlayer.size[1];
		return !(l > pr || r < 0 || t > pb || b < 0);
	}
	private disposeElements() {
		for (const realWord of this.splittedWords) {
			for (const a of realWord.elementAnimations) {
				a.cancel();
			}
			for (const a of realWord.maskAnimations) {
				a.cancel();
			}
			for (const sub of realWord.subElements) {
				sub.remove();
				sub.parentNode?.removeChild(sub);
			}
			realWord.elementAnimations = [];
			realWord.maskAnimations = [];
			realWord.subElements = [];
			realWord.mainElement.remove();
			realWord.mainElement.parentNode?.removeChild(realWord.mainElement);
		}
		this.splittedWords = [];
	}
	dispose(): void {
		this.disposeElements();
		this.element.remove();
	}
}

import { LyricPlayer } from ".";
import { Disposable, HasElement, LyricLine, LyricWord } from "../interfaces";
import { createMatrix4, matrix4ToCSS, scaleMatrix4 } from "../utils/matrix";
import { Spring } from "../utils/spring";
import bezier from "bezier-easing";
import { WebAnimationSpring } from "../utils/wa-spring";

const CJKEXP = /^[\p{Unified_Ideograph}\u0800-\u9FFC]+$/u;

enum EmphasizeAnimationMethod {
	FloatAndGlow = "float-and-glow",
	FloatOnly = "float-only",
}

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
	const bezIn = bezier(0.25, 0, 0.5, 1);
	const bezOut = bezier(0.25, 0, 0.5, 1);
	return (x: number) => (x < mid ? bezIn(beginNum(x)) : 1 - bezOut(endNum(x)));
};
const defaultEmpEasing = makeEmpEasing(EMP_EASING_MID);

// function generateFadeGradient(
// 	width: number,
// 	padding = 0,
// 	bright = "rgba(0,0,0,0.85)",
// 	dark = "rgba(0,0,0,0.5)",
// ): [string, number, number] {
// 	const totalAspect = 2 + width + padding;
// 	const widthInTotal = width / totalAspect;
// 	const leftPos = (1 - widthInTotal) / 2;
// 	return [
// 		`linear-gradient(to right,${bright} ${leftPos * 100}%,${dark} ${
// 			leftPos * 100
// 		}%,${bright} ${(leftPos + widthInTotal) * 100}%,${dark} ${
// 			(leftPos + widthInTotal) * 100
// 		}%)`,
// 		widthInTotal,
// 		totalAspect,
// 	];
// }

function generateFadeGradient(
	width: number,
	padding = 0,
	bright = "rgba(0,0,0,0.85)",
	dark = "rgba(0,0,0,0.5)",
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
			resplitedWords.push(w);
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
		word.word.trim().length >= 1
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
	// readonly lineWebAnimationTransforms = {
	// 	posX: new WebAnimationSpring(this.element, "transform", (v) => `translateX(${v.toFixed(1)}px)`),
	// 	posY: new WebAnimationSpring(this.element, "transform", (v) => `translateY(${v.toFixed(1)}px)`),
	// 	scale: new WebAnimationSpring(this.element, "transform", (v) => `scale(${v.toFixed(4)})`, 1),
	// };

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

	private isEnabled = false;
	enable(maskAnimationTime = 0) {
		this.isEnabled = true;
		this.element.classList.add("active");
		const main = this.element.children[0] as HTMLDivElement;
		for (const word of this.splittedWords) {
			for (const a of word.elementAnimations) {
				a.currentTime = 0;
				a.playbackRate = 1;
				a.play();
			}
			for (const a of word.maskAnimations) {
				a.currentTime = maskAnimationTime;
				a.playbackRate = 1;
				a.play();
			}
		}
		main.classList.add("active");
	}
	measureSize(): [number, number] {
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
	disable(maskAnimationTime = 0) {
		this.isEnabled = false;
		this.element.classList.remove("active");
		const main = this.element.children[0] as HTMLDivElement;
		for (const word of this.splittedWords) {
			for (const a of word.elementAnimations) {
				if (a.id === "float-word") {
					a.playbackRate = -1;
					a.play();
				}
			}
			for (const a of word.maskAnimations) {
				a.currentTime = Math.min(
					this.totalDuration,
					Math.max(0, maskAnimationTime - this.lyricLine.startTime),
				);
				a.pause();
			}
		}
		main.classList.remove("active");
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
		this.splittedWords = [];
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
					if (emp) {
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
							elementAnimations: [this.initFloatAnimation(word, mainWordEl)],
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
				if (emp) {
					this.splittedWords[
						this.splittedWords.length - 1
					].elementAnimations.push(
						...this.initEmphasizeAnimation(
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
				if (emp) {
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
		const a = wordEl.animate(
			[
				{
					transform: "translateY(0)",
				},
				{
					transform: "translateY(-0.05em)",
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
		characterElements: HTMLElement[],
		duration: number,
		delay: number,
	): Animation[] {
		const de = Math.max(0, delay);
		const du = Math.max(1000, duration);

		let method = EmphasizeAnimationMethod.FloatAndGlow;

		if (du < 1200) {
			method = EmphasizeAnimationMethod.FloatOnly;
		}

		let result: Animation[] = [];

		switch (method) {
			case EmphasizeAnimationMethod.FloatAndGlow: {
				let amount = 0;
				let blur = 0;
				if (du >= 1200 && du < 2000) {
					amount = 0.7;
					blur = 0.3;
				} else if (du >= 2000 && du < 3000) {
					amount = 0.8;
					blur = 0.5;
				} else if (du >= 3000 && du < 4000) {
					amount = 0.9;
					blur = 0.6;
				} else if (du >= 4000) {
					amount = 1.0;
					blur = 0.6;
				}
				const animateDu = Number.isFinite(du) ? du * 1.25 : 0;
				const empEasing = makeEmpEasing(EMP_EASING_MID);
				result = characterElements.flatMap((el, i, arr) => {
					const wordDe = de + (du / 3 / arr.length) * i;
					const result: Animation[] = [];

					const frames: Keyframe[] = new Array(ANIMATION_FRAME_QUANTITY)
						.fill(0)
						.map((_, i) => {
							const x = (i + 1) / ANIMATION_FRAME_QUANTITY;
							const y = empEasing(x);
							const transX = Math.sin(x * Math.PI * 2);
							const glowLevel =
								Math.max(0, x < EMP_EASING_MID ? y / 2 : y - 0.5) * blur;
							// const floatLevel =
							// 	Math.max(0, x < EMP_EASING_MID ? y : y - 0.5);

							const mat = scaleMatrix4(createMatrix4(), 1 + y * 0.1 * amount);

							return {
								offset: x,
								transform: `${matrix4ToCSS(mat, 4)} translate(${
									transX * 0.01 * amount
								}em,${-y * 0.05}em)`,
								textShadow: `rgba(255, 255, 255, ${glowLevel}) 0 0 10px`,
							};
						});
					const ani = el.animate(frames, {
						duration: animateDu,
						delay: Number.isFinite(wordDe) ? wordDe : 0,
						id: `emphasize-word-float-and-glow-${el.innerText}-${i}`,
						iterations: 1,
						composite: "replace",
						easing: "linear",
						fill: "both",
					});
					ani.onfinish = () => {
						ani.pause();
					};
					ani.pause();
					result.push(ani);

					return result;
				});
				break;
			}
			case EmphasizeAnimationMethod.FloatOnly: {
				result = characterElements.flatMap((el, i, arr) => {
					const wordDe = de + (du / 1.5 / arr.length) * i;
					const result: Animation[] = [];

					const frames: Keyframe[] = new Array(ANIMATION_FRAME_QUANTITY)
						.fill(0)
						.map((_, i) => {
							const x = ((i + 1) / ANIMATION_FRAME_QUANTITY) * EMP_EASING_MID;
							const y = defaultEmpEasing(x);

							return {
								offset: x,
								transform: `translateY(${-y * 0.03}em)`,
							};
						});
					const ani = el.animate(frames, {
						duration: Number.isFinite(du) ? du * 2 : 0,
						delay: Number.isFinite(wordDe) ? wordDe : 0,
						id: `emphasize-word-float-only-${el.innerText}-${i}`,
						iterations: 1,
						composite: "replace",
						easing: "linear",
						fill: "both",
					});
					ani.onfinish = () => {
						ani.pause();
					};
					ani.pause();
					result.push(ani);

					return result;
				});
				break;
			}
		}

		return result;
	}
	private get totalDuration() {
		return this.lyricLine.endTime - this.lyricLine.startTime;
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
		const totalDuration = this.totalDuration;
		this.splittedWords.forEach((word, i) => {
			const wordEl = word.mainElement;
			if (wordEl) {
				const fadeWidth = word.height;
				const [maskImage, totalAspect] = generateFadeGradient(
					fadeWidth / (word.width + word.padding * 2),
					0,
					"rgba(0,0,0,0.85)",
					"rgba(0,0,0,0.25)",
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
				const widthBeforeSelf = this.splittedWords
					.slice(0, i)
					.reduce((a, b) => a + b.width, 0);
				const clampOffset = (x: number) =>
					Math.max(
						-(word.width + word.padding * 2 + fadeWidth),
						Math.min(0, x),
					);
				let curPos =
					-widthBeforeSelf - word.width - word.padding * 2 - fadeWidth;
				let timeOffset = 0;
				const frames: Keyframe[] = [];
				const pushFrame = () => {
					console.log("pushFrame", curPos, timeOffset * totalDuration);
					if (timeOffset === frames[frames.length - 1]?.offset) {
						frames[frames.length - 1] = {
							offset: timeOffset,
							maskPosition: `${clampOffset(curPos)}px 0px, left top`,
							webkitMaskPosition: `${clampOffset(curPos)}px 0px, left top`,
						};
					} else {
						frames.push({
							offset: timeOffset,
							maskPosition: `${clampOffset(curPos)}px 0px, left top`,
							webkitMaskPosition: `${clampOffset(curPos)}px 0px, left top`,
						});
					}
				};
				pushFrame();
				let lastTimeStamp = 0;
				// TODO: 需要修正这里的动画帧生成逻辑，勿动
				this.splittedWords.forEach((otherWord, j) => {
					{
						const curTimeStamp = otherWord.startTime - this.lyricLine.startTime;
						const space = curTimeStamp - lastTimeStamp;
						timeOffset += space / totalDuration;
						pushFrame();
						lastTimeStamp = curTimeStamp;
					}
					{
						const space = otherWord.endTime - otherWord.startTime;
						timeOffset += space / totalDuration;
						curPos += otherWord.width;
						if (j === i) curPos = 0;
						pushFrame();
						lastTimeStamp += space;
					}
				});
				frames[frames.length - 1].offset = 1;
				frames[frames.length - 1].maskPosition = "0px 0px, left top";
				frames[frames.length - 1].webkitMaskPosition = "0px 0px, left top";
				for (const a of word.maskAnimations) {
					a.cancel();
				}
				try {
					const ani = wordEl.animate(frames, {
						duration: totalDuration || 1,
						id: `fade-word-${word.word}-${i}`,
						easing: "linear",
						fill: "both",
					});
					ani.pause();
					word.maskAnimations = [ani];
				} catch (err) {
					console.warn("应用渐变动画发生错误", frames, totalDuration, err);
				}
			}
		});
		if (this._hide) {
			if (this._prevParentEl) {
				this.element.remove();
			}
			this.element.style.display = "none";
			this.element.style.visibility = "";
		}
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
		main.style.opacity = `${opacity}`;
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
	dispose(): void {
		this.element.remove();
	}
}

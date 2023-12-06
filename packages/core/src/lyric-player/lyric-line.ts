import { LyricPlayer } from ".";
import { Disposable, HasElement, LyricLine, LyricWord } from "../interfaces";
import { Spring } from "../utils/spring";

const CJKEXP = /^[\p{Unified_Ideograph}\u0800-\u9FFC]+$/u;

interface RealWord extends LyricWord {
	mainElement: HTMLSpanElement;
	subElements: HTMLSpanElement[];
	elementAnimations: Animation[];
	width: number;
	height: number;
	shouldEmphasize: boolean;
}

function generateFadeGradient(
	width: number,
	bright = "rgba(0,0,0,0.85)",
	dark = "rgba(0,0,0,0.5)",
): [string, number, number] {
	const totalAspect = 2 + width;
	const widthInTotal = width / totalAspect;
	const leftPos = (1 - widthInTotal) / 2;
	return [
		`linear-gradient(to right,${bright} ${leftPos * 100}%,${dark} ${
			(leftPos + widthInTotal) * 100
		}%)`,
		widthInTotal,
		totalAspect,
	];
}

// 将输入的单词重新分组，之间没有空格的单词将会组合成一个单词数组
// 例如输入：["Life", " ", "is", " a", " su", "gar"]
// 应该返回：["Life", " ", "is", " a", [" su", "gar"]]
function chunkLyricWords<T>(
	words: T[],
	wordGetter: (word: T) => string,
): (T | T[])[] {
	let wordChunk: string[] = [];
	let wChunk: T[] = [];
	const result: (T | T[])[] = [];

	for (const w of words) {
		const word = wordGetter(w);
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
	return word.endTime - word.startTime >= 1000 && word.word.length <= 7;
}

export class RawLyricLineMouseEvent extends MouseEvent {
	constructor(public readonly line: LyricLineEl, event: MouseEvent) {
		super(event.type, event);
	}
}

type MouseEventMap = {
	[evt in
		keyof HTMLElementEventMap]: HTMLElementEventMap[evt] extends MouseEvent
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
	// rome-ignore lint/correctness/noUnreachableSuper: <explanation>
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
				this.element.addEventListener(type, this.onMouseEvent);
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
					this.element.removeEventListener(type, this.onMouseEvent);
			}
		}
	}

	private isEnabled = false;
	enable() {
		this.isEnabled = true;
		this.element.classList.add("active");
		const main = this.element.children[0] as HTMLDivElement;
		this.splittedWords.forEach((word) => {
			word.elementAnimations.forEach((a) => {
				a.currentTime = 0;
				a.playbackRate = 1;
				a.play();
			});
		});
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
	disable() {
		this.isEnabled = false;
		this.element.classList.remove("active");
		const main = this.element.children[0] as HTMLDivElement;
		this.splittedWords.forEach((word) => {
			word.elementAnimations.forEach((a) => {
				if (a.id === "float-word") {
					a.playbackRate = -1;
					a.play();
				}
			});
		});
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
		let style = `transform:translate(${this.lineTransforms.posX
			.getCurrentPosition()
			.toFixed(2)}px,${this.lineTransforms.posY
			.getCurrentPosition()
			.toFixed(2)}px) scale(${this.lineTransforms.scale
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
		const chunkedWords = chunkLyricWords(this.lyricLine.words, (w) => w.word);
		main.innerHTML = "";
		this.splittedWords = [];
		for (const chunk of chunkedWords) {
			if (chunk instanceof Array) {
				const emp = chunk
					.map((word) => shouldEmphasize(word))
					.reduce((a, b) => a || b, false);
				const merged = chunk.reduce(
					(a, b) => {
						a.endTime = Math.max(a.endTime, b.endTime);
						a.startTime = Math.min(a.startTime, b.startTime);
						a.word += b.word;
						return a;
					},
					{ word: "", startTime: Infinity, endTime: -Infinity },
				);
				const wrapperWordEl = document.createElement("span");
				for (const word of chunk) {
					const mainWordEl = document.createElement("span");
					const mainWordFloatAnimation = this.initFloatAnimation(
						merged,
						mainWordEl,
					);
					if (emp) {
						mainWordEl.classList.add("emphasize");
						const charEls: HTMLSpanElement[] = [];
						for (const char of word.word.trim().split("")) {
							const charEl = document.createElement("span");
							charEl.innerText = char;
							charEls.push(charEl);
							mainWordEl.appendChild(charEl);
						}
						const realWord: RealWord = {
							...word,
							mainElement: mainWordEl,
							subElements: charEls,
							elementAnimations: [mainWordFloatAnimation],
							width: 0,
							height: 0,
							shouldEmphasize: emp,
						};
						realWord.elementAnimations.push(
							...this.initEmphasizeAnimation(realWord),
						);
						this.splittedWords.push(realWord);
					} else {
						mainWordEl.innerText = word.word;
						this.splittedWords.push({
							...word,
							mainElement: mainWordEl,
							subElements: [],
							elementAnimations: [mainWordFloatAnimation],
							width: 0,
							height: 0,
							shouldEmphasize: emp,
						});
					}
					wrapperWordEl.appendChild(mainWordEl);
				}
				if (merged.word.trimStart() !== merged.word) {
					main.appendChild(document.createTextNode(" "));
				}
				main.appendChild(wrapperWordEl);
				if (merged.word.trimEnd() !== merged.word) {
					main.appendChild(document.createTextNode(" "));
				}
			} else if (chunk.word.trim().length === 0) {
				main.appendChild(document.createTextNode(" "));
			} else {
				const emp = shouldEmphasize(chunk);
				const mainWordEl = document.createElement("span");
				const realWord: RealWord = {
					...chunk,
					mainElement: mainWordEl,
					subElements: [],
					elementAnimations: [this.initFloatAnimation(chunk, mainWordEl)],
					width: 0,
					height: 0,
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
					realWord.elementAnimations.push(
						...this.initEmphasizeAnimation(realWord),
					);
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
					transform: "translateY(0px)",
				},
				{
					transform: "translateY(-3%)",
				},
			],
			{
				duration: isFinite(duration) ? duration : 0,
				delay: isFinite(delay) ? delay : 0,
				id: "float-word",
				composite: "add",
				fill: "both",
			},
		);
		a.pause();
		return a;
	}
	private initEmphasizeAnimation(word: RealWord): Animation[] {
		const delay = word.startTime - this.lyricLine.startTime;
		const duration = word.endTime - word.startTime;
		return word.subElements.map((el, i, arr) => {
			const du = Math.max(1000, word.endTime - word.startTime);
			const de = delay + (duration / arr.length) * i;
			const a = el.animate(
				[
					{
						offset: 0,
						transform: "translate3d(0, 0, 0px)",
						filter: "drop-shadow(0 0 0 var(--amll-lyric-view-color,white))",
					},
					{
						offset: 0.5,
						transform: "translate3d(0, -0.02em, 20px)",
						filter:
							"drop-shadow(0 0 0.05em var(--amll-lyric-view-color,white))",
					},
					{
						offset: 1,
						transform: "translate3d(0, 0, 0)",
						filter: "drop-shadow(0 0 0 var(--amll-lyric-view-color,white))",
					},
				],
				{
					duration: isFinite(du) ? du : 0,
					delay: isFinite(de) ? de : 0,
					id: "glow-word",
					iterations: 1,
					composite: "replace",
					easing: "ease-in-out",
					fill: "both",
				},
			);
			a.pause();
			return a;
		});
	}
	updateMaskImage() {
		if (this._hide) {
			if (this._prevParentEl) {
				this._prevParentEl.appendChild(this.element);
			}
			this.element.style.display = "";
			this.element.style.visibility = "hidden";
		}
		this.splittedWords.forEach((word) => {
			const wordEl = word.mainElement;
			if (wordEl) {
				word.width = wordEl.clientWidth;
				word.height = wordEl.clientHeight;
				const fadeWidth = word.height / 2;
				const [maskImage, _widthInTotal, totalAspect] = generateFadeGradient(
					fadeWidth / word.width,
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
				const w = word.width + fadeWidth;
				const maskPos = `clamp(${-w}px,calc(${-w}px + (var(--amll-player-time) - ${
					word.startTime
				})*${
					w / Math.abs(word.endTime - word.startTime)
				}px),0px) 0px, left top`;
				// const maskPos = `clamp(0px,${w}px,${w}px) 0px, left top`;
				wordEl.style.maskPosition = maskPos;
				wordEl.style.webkitMaskPosition = maskPos;
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
			this.blur = Math.min(32, blur);
			if (force)
				this.element.classList.add(
					this.lyricPlayer.style.classes.tmpDisableTransition,
				);
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
			this.lineTransforms.posX.setTargetPosition(left, delay);
			this.lineTransforms.posY.setTargetPosition(top, delay);
			this.lineTransforms.scale.setTargetPosition(scale);
			if (this.blur !== Math.min(32, blur)) {
				this.blur = Math.min(32, blur);
				this.element.style.filter = `blur(${Math.min(32, blur)}px)`;
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

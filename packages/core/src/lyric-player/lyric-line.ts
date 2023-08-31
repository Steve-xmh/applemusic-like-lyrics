import { LyricPlayer } from ".";
import { Disposable, HasElement, LyricLine, LyricWord } from "../interfaces";
import { Spring } from "../utils/spring";

const CJKEXP = /^[\p{Unified_Ideograph}\u0800-\u9FFC]+$/u;

interface RealWord extends LyricWord {
	elements: HTMLSpanElement[];
	elementAnimations: Animation[];
	width: number;
	height: number;
	shouldEmphasize: boolean;
}

function generateFadeGradient(
	width: number,
	bright = "rgba(0,0,0,1)",
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

// 果子在对辉光效果的解释是一种强调（emphasized）效果
// 条件是一个单词时长大于等于 1s 且长度小于等于 7
export function shouldEmphasize(word: LyricWord): boolean {
	return word.endTime - word.startTime >= 1000 && word.word.length <= 7;
}

export class LyricLineEl implements HasElement, Disposable {
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
			this.element.style.display = "";
			this.element.style.visibility = "hidden";
		}
		const size: [number, number] = [
			this.element.clientWidth,
			this.element.clientHeight,
		];
		if (this._hide) {
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
	private lastStyle = "";
	show() {
		this._hide = false;
		this.rebuildStyle();
	}
	hide() {
		this._hide = true;
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
		let style = `transform:translate(${this.lineTransforms.posX.getCurrentPosition()}px,${this.lineTransforms.posY.getCurrentPosition()}px) scale(${this.lineTransforms.scale.getCurrentPosition()});`;
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
		if (this.lyricPlayer._getIsNonDynamic()) {
			while (main.firstChild) {
				main.removeChild(main.firstChild);
				collectNodes(main.firstChild);
			}
			main.innerText = this.lyricLine.words.map((w) => w.word).join("");
			trans.innerText = this.lyricLine.translatedLyric;
			roman.innerText = this.lyricLine.romanLyric;
			return;
		}
		this.splittedWords = [];
		this.lyricLine.words.forEach((word) => {
			const splited = word.word.split(/\s+/);
			const trimmedLength = splited.reduce((pv, cv) => pv + cv.length, 0);
			let pos = 0;
			splited.forEach((sub, i) => {
				if (i > 0) {
					this.splittedWords.push({
						word: " ",
						startTime: 0,
						endTime: 0,
						width: 0,
						height: 0,
						elements: [],
						elementAnimations: [],
						shouldEmphasize: false,
					});
				}
				this.splittedWords.push({
					word: sub,
					startTime:
						word.startTime +
						((word.endTime - word.startTime) / trimmedLength) * pos,
					endTime:
						word.startTime +
						((word.endTime - word.startTime) / trimmedLength) *
							(pos + sub.length),
					width: 0,
					height: 0,
					elements: [],
					elementAnimations: [],
					shouldEmphasize: shouldEmphasize(word),
				});
				pos += sub.length;
			});
		});
		// 回收元素以复用
		const reusableElements: HTMLElement[] = [];
		const reusableTextNodes: Text[] = [];
		function collectNodes(curNode: Node) {
			while (curNode.firstChild) {
				if (curNode.firstChild.nodeType === Node.ELEMENT_NODE)
					reusableElements.push(main.firstChild as HTMLElement);
				else if (curNode.firstChild.nodeType === Node.TEXT_NODE)
					reusableTextNodes.push(main.firstChild as Text);
				curNode.removeChild(curNode.firstChild);
				collectNodes(curNode.firstChild);
			}
		}
		collectNodes(main);
		let lastWordEl: HTMLSpanElement | null = null;
		this.splittedWords.forEach((word) => {
			if (word.word.trim().length > 0) {
				if (word.shouldEmphasize) {
					const wordEl =
						reusableElements.pop() ?? document.createElement("span");
					wordEl.className = "emphasize";
					word.elements = [wordEl];
					for (const c of word.word) {
						const charEl =
							reusableElements.pop() ?? document.createElement("span");
						charEl.className = "";
						charEl.innerText = c;
						wordEl.appendChild(charEl);
						word.elements.push(charEl);
					}
					word.elementAnimations = this.initEmphasizeAnimation(word);
					if (lastWordEl && !CJKEXP.test(word.word)) {
						if (lastWordEl.childElementCount > 0) {
							lastWordEl.appendChild(wordEl);
						} else {
							const wholeWordEl =
								reusableElements.pop() ?? document.createElement("span");
							wholeWordEl.className = "";
							lastWordEl.remove();
							wholeWordEl.appendChild(lastWordEl);
							wholeWordEl.appendChild(wordEl);
							main.appendChild(wholeWordEl);
							lastWordEl = wholeWordEl;
						}
					} else {
						lastWordEl = CJKEXP.test(word.word) ? null : wordEl;
						main.appendChild(wordEl);
					}
				} else {
					const wordEl =
						reusableElements.pop() ?? document.createElement("span");
					wordEl.className = "";
					wordEl.innerText = word.word;
					word.elements = [wordEl];
					word.elementAnimations.push(this.initFloatAnimation(word, wordEl));
					if (lastWordEl) {
						if (lastWordEl.childElementCount > 0) {
							lastWordEl.appendChild(wordEl);
						} else {
							const wholeWordEl =
								reusableElements.pop() ?? document.createElement("span");
							wholeWordEl.className = "";
							lastWordEl.remove();
							wholeWordEl.appendChild(lastWordEl);
							wholeWordEl.appendChild(wordEl);
							main.appendChild(wholeWordEl);
							lastWordEl = wholeWordEl;
						}
					} else {
						lastWordEl = wordEl;
						main.appendChild(wordEl);
					}
				}
			} else if (word.word.length > 0) {
				const wordEl = reusableTextNodes.pop() ?? document.createTextNode(" ");
				main.appendChild(wordEl);
				lastWordEl = null;
			} else {
				lastWordEl = null;
			}
		});
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
		return word.elements.map((el, i, arr) => {
			if (i === 0) {
				return this.initFloatAnimation(word, el);
			} else {
				const du = Math.max(1000, word.endTime - word.startTime);
				const de = delay + (duration / (arr.length - 1)) * (i - 1);
				const a = el.animate(
					[
						{
							offset: 0,
							transform: "translate3d(0, 0px, 0px)",
							filter: "drop-shadow(0 0 0 var(--amll-lyric-view-color,white))",
						},
						{
							offset: 0.5,
							transform: "translate3d(0, -2%, 20px)",
							filter:
								"drop-shadow(0 0 0.2em var(--amll-lyric-view-color,white))",
						},
						{
							offset: 1,
							transform: "translate3d(0, 0px, 0)",
							filter: "drop-shadow(0 0 0 var(--amll-lyric-view-color,white))",
						},
					],
					{
						duration: isFinite(du) ? du : 0,
						delay: isFinite(de) ? de : 0,
						id: "glow-word",
						iterations: 1,
						composite: "replace",
						fill: "both",
					},
				);
				a.pause();
				return a;
			}
		});
	}
	updateMaskImage() {
		if (this._hide) {
			this.element.style.display = "";
			this.element.style.visibility = "hidden";
		}
		this.splittedWords.forEach((word) => {
			const wordEl = word.elements[0];
			if (wordEl) {
				word.width = wordEl.clientWidth;
				word.height = wordEl.clientHeight;
				const [maskImage, _widthInTotal, totalAspect] = generateFadeGradient(
					16 / word.width,
					"rgba(0,0,0,0.75)",
					"rgba(0,0,0,0.25)",
				);
				const totalAspectStr = `${totalAspect * 100}% 100%`;
				if (this.lyricPlayer.supportMaskImage) {
					wordEl.style.maskImage = maskImage;
					wordEl.style.maskOrigin = "left";
					wordEl.style.maskSize = totalAspectStr;
				} else {
					wordEl.style.webkitMaskImage = maskImage;
					wordEl.style.webkitMaskOrigin = "left";
					wordEl.style.webkitMaskSize = totalAspectStr;
				}
				const w = word.width + 16;
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
		this.left = left;
		this.top = top;
		this.scale = scale;
		this.delay = (delay * 1000) | 0;
		const main = this.element.children[0] as HTMLDivElement;
		main.style.opacity = `${opacity}`;
		if (force || !this.lyricPlayer.getEnableSpring()) {
			this.blur = Math.min(32, blur);
			if (force)
				this.element.classList.add(
					this.lyricPlayer.style.classes.tmpDisableTransition,
				);
			this.lineTransforms.posX.setPosition(left);
			this.lineTransforms.posY.setPosition(top);
			this.lineTransforms.scale.setPosition(scale);
			if (!this.lyricPlayer.getEnableSpring()) this.show();
			else this.rebuildStyle();
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
	get isInSight() {
		const l = this.lineTransforms.posX.getCurrentPosition();
		const t = this.lineTransforms.posY.getCurrentPosition();
		const r = l + this.lineSize[0];
		const b = t + this.lineSize[1];
		const pl = this.lyricPlayer.pos[0];
		const pt = this.lyricPlayer.pos[1];
		const pr = this.lyricPlayer.pos[0] + this.lyricPlayer.size[0];
		const pb = this.lyricPlayer.pos[1] + this.lyricPlayer.size[1];
		return !(l > pr || t > pb || r < pl || b < pt);
	}
	dispose(): void {
		this.element.remove();
	}
}

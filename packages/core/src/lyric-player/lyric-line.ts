import { LyricPlayer } from ".";
import { Disposable, HasElement, LyricLine, LyricWord } from "../interfaces";

const CJKEXP =
	/^([\p{Unified_Ideograph}\u3006\u3007][\ufe00-\ufe0f\u{e0100}-\u{e01ef}]?)+$/u;

interface RealWord extends LyricWord {
	width: number;
	height: number;
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

export class LyricLineEl implements HasElement, Disposable {
	private element: HTMLElement = document.createElement("div");
	private currentTime: number = 0;
	private left: number = 0;
	private top: number = 0;
	private scale: number = 1;
	private shouldInstant = true;
	private splittedWords: RealWord[] = [];
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
	enable() {
		this.element.classList.add("active");
		const main = this.element.children[0] as HTMLDivElement;
		main.classList.add("active");
	}
	disable() {
		this.element.classList.remove("active");
		const main = this.element.children[0] as HTMLDivElement;
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
	rebuildStyle() {
		let style = `transform:translate(${this.left}px,${this.top}px) scale(${this.scale});`;
		this.element.setAttribute("style", style);
	}
	rebuildElement() {
		const main = this.element.children[0] as HTMLDivElement;
		const trans = this.element.children[1] as HTMLDivElement;
		const roman = this.element.children[2] as HTMLDivElement;
		this.splittedWords = [];
		this.lyricLine.words.forEach((word) => {
			if (CJKEXP.test(word.word)) {
				this.splittedWords = this.splittedWords.concat(
					word.word.split("").map((c, i, w) => ({
						word: c,
						startTime:
							word.startTime + (i * (word.endTime - word.startTime)) / w.length,
						endTime:
							word.startTime +
							((i + 1) * (word.endTime - word.startTime)) / w.length,
						width: 0,
						height: 0,
					})),
				);
			} else {
				this.splittedWords.push({
					...word,
					width: 0,
					height: 0,
				});
			}
		});
		while (this.splittedWords.length > main.childElementCount) {
			main.appendChild(document.createElement("span"));
		}
		for (
			let i = 0;
			i < Math.max(main.childElementCount, this.splittedWords.length);
			i++
		) {
			const word = this.splittedWords[i];
			const wordEl = main.children[i] as HTMLSpanElement;
			if (word) {
				wordEl.innerText = word.word;
			} else {
				wordEl.innerText = "";
			}
		}
		trans.innerText = this.lyricLine.translatedLyric;
		roman.innerText = this.lyricLine.romanLyric;
	}
	updateMaskImage() {
		const main = this.element.children[0] as HTMLDivElement;
		for (
			let i = 0;
			i < Math.max(main.childElementCount, this.splittedWords.length);
			i++
		) {
			const word = this.splittedWords[i];
			const wordEl = main.children[i] as HTMLSpanElement;
			if (word?.word?.trim()?.length > 0) {
				word.width = wordEl.clientWidth;
				word.height = wordEl.clientHeight;
				const [maskImage, widthInTotal, totalAspect] = generateFadeGradient(
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
		}
	}
	getElement() {
		return this.element;
	}
	setTransform(
		left: number = this.left,
		top: number = this.top,
		scale: number = this.scale,
		force = false,
	) {
		this.left = left;
		this.top = top;
		this.scale = scale;
		this.rebuildStyle();
	}
	update(delta: number = 0) {}
	dispose(): void {
		this.element.remove();
	}
}

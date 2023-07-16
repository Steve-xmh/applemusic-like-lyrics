import { LyricPlayer } from ".";
import { Disposable, HasElement, LyricLine } from "../interfaces";

export class LyricLineEl implements HasElement, Disposable {
	private element: HTMLElement = document.createElement("div");
	private currentTime: number = 0;
    private left: number = 0;
    private top: number = 0;
    private scale: number = 1;
    private shouldInstant = true;
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
        this.element.setAttribute("class", this.lyricPlayer.style.classes.lyricLine);
		this.element.appendChild(document.createElement("div")); // 歌词行
		this.element.appendChild(document.createElement("div")); // 翻译行
		this.element.appendChild(document.createElement("div")); // 音译行
		const trans = this.element.children[1] as HTMLDivElement;
		const roman = this.element.children[2] as HTMLDivElement;
		trans.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine)
		roman.setAttribute("class", this.lyricPlayer.style.classes.lyricSubLine)
		this.rebuildElement();
        this.rebuildStyle();
	}
	setLine(line: LyricLine) {
		this.lyricLine = line;
		this.rebuildElement();
        this.rebuildStyle();
	}
    rebuildStyle() {
        let style = `transform:translate(${this.left}px,${this.top}px) scale(${this.scale});`;
        this.element.setAttribute("style", style);
    }
	rebuildElement() {
		const main = this.element.children[0] as HTMLDivElement;
		const trans = this.element.children[1] as HTMLDivElement;
		const roman = this.element.children[2] as HTMLDivElement;
		while (this.lyricLine.words.length > main.childElementCount) {
			main.appendChild(document.createElement("span"));
		}
		for (
			let i = 0;
			i < Math.max(main.childElementCount, this.lyricLine.words.length);
			i++
		) {
			const word = this.lyricLine.words[i];
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
	getElement() {
		return this.element;
	}
    setTransform(left: number = this.left, top: number = this.top, scale: number = this.scale) {
        this.left = left;
        this.top = top;
        this.scale = scale;
        this.rebuildStyle();
    }
    update() {
        
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
	}
}

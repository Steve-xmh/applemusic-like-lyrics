import { LyricPlayer } from ".";
import type { Disposable, HasElement } from "../interfaces";

export class InterludeDots implements HasElement, Disposable {
	private element: HTMLElement = document.createElement("div");
	private dot0: HTMLElement = document.createElement("span");
	private dot1: HTMLElement = document.createElement("span");
	private dot2: HTMLElement = document.createElement("span");
	constructor(private lyricPlayer: LyricPlayer) {
		this.element.className = lyricPlayer.style.classes.interludeDots;
		this.dot0.innerText = "·"
		this.dot1.innerText = "·"
		this.dot2.innerText = "·"
		this.element.appendChild(this.dot0);
		this.element.appendChild(this.dot1);
		this.element.appendChild(this.dot2);
	}
	getElement() {
		return this.element;
	}
	dispose() {
		this.element.remove();
	}
}

import type { Disposable, HasElement } from "../interfaces";
import styles from "../styles/lyric-player.module.css";

export * from "./dom";

export abstract class LyricPlayerBase
	extends EventTarget
	implements HasElement, Disposable
{
	protected element: HTMLElement = document.createElement("div");

	constructor() {
		super();
		this.element.classList.add(styles.lyricPlayer);
	}

	protected onResize() {}

	getElement(): HTMLElement {
		return this.element;
	}
	dispose(): void {
		this.element.remove();
	}
}

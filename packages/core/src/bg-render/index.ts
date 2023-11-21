/**
 * @fileoverview
 * 一个播放歌词的组件
 * @author SteveXMH
 */

import type { HasElement, Disposable } from "../interfaces";
import { PixiRenderer } from "./pixi-renderer";

export class BackgroundRender
	extends PixiRenderer
	implements HasElement, Disposable
{
	private element: HTMLCanvasElement;
	constructor() {
		const canvas = document.createElement("canvas");
		super(canvas);
		this.element = canvas;
		canvas.style.pointerEvents = "none";
		canvas.style.zIndex = "-1";
		canvas.style.contain = "strict";
	}
	getElement() {
		return this.element;
	}
	dispose() {
		super.dispose();
		this.element.remove();
	}
}

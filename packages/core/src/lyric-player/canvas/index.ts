import type { LyricLine } from "../../interfaces";
import { LyricPlayerBase } from "../base";
import { CanvasLyricLine } from "./lyric-line";

export class CanvasLyricPlayer extends LyricPlayerBase {
	private canvasElement = document.createElement("canvas");
	override currentLyricLineObjects: CanvasLyricLine[] = [];
	/** @internal */
	readonly ctx = this.canvasElement.getContext("2d")!;
	/** @internal */
	baseLineHeight = 1;
	/** @internal */
	baseFontSize = 30;
	/** @internal */
	baseFontFamily = "sans-serif";
	constructor() {
		super();
		this.element.classList.add("amll-lyric-player", "dom");
		this.canvasElement.style.width = "100%";
		this.canvasElement.style.height = "100%";
		this.canvasElement.style.display = "block";
		this.canvasElement.style.position = "absolute";
		this.onResize();
		this.update();
		// TODO: 添加鼠标事件监听
		this.element.addEventListener("mousemove", (evt) => {
			evt.preventDefault();
		});
		this.element.addEventListener("click", (evt) => {
			evt.preventDefault();
		});
		this.element.addEventListener("contextmenu", (evt) => {
			evt.preventDefault();
		});
		this.element.appendChild(this.canvasElement);
		this.element.appendChild(this.interludeDots.getElement());
		this.element.appendChild(this.bottomLine.getElement());
	}
	override setLyricLines(lines: LyricLine[], initialTime?: number): void {
		super.setLyricLines(lines, initialTime);

		this.currentLyricLineObjects = this.processedLines.map(
			(line) => new CanvasLyricLine(this, line),
		);

		this.setLinePosXSpringParams({});
		this.setLinePosYSpringParams({});
		this.setLineScaleSpringParams({});
		this.calcLayout(true, true);
	}
	override onResize(): void {
		const computedStyle = getComputedStyle(this.element);
		this.baseFontSize = Number.parseFloat(computedStyle.fontSize) || 30;
		this.baseFontFamily = computedStyle.fontFamily;
		const realWidth = this.canvasElement.clientWidth;
		const realHeight = this.canvasElement.clientHeight;
		this.size[0] = realWidth - this.baseFontSize * 2;
		this.size[1] = realHeight;
		this.canvasElement.width = realWidth * devicePixelRatio;
		this.canvasElement.height = realHeight * devicePixelRatio;
		for (const line of this.currentLyricLineObjects) {
			line.relayout();
		}
		console.log("CanvasLyricPlayer.onResize", this.size);
		this.calcLayout(true, true);
	}
	/**
	 * @internal
	 * @param size
	 */
	setFontSize(emSize: number): void {
		this.ctx.font = `${this.baseFontSize * emSize}px ${this.baseFontFamily}`;
	}
	override update(delta = 0): void {
		super.update(delta);

		const ctx = this.ctx;
		const width = this.size[0];
		const height = this.size[1];
		ctx.resetTransform();
		ctx.scale(devicePixelRatio, devicePixelRatio);
		ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
		ctx.fillStyle = "currentColor";
		ctx.font = `${this.baseFontSize}px ${this.baseFontFamily}`;
		ctx.textRendering = "optimizeSpeed";
		ctx.textAlign = "left";

		ctx.save();
		ctx.translate(this.baseFontSize, 0);

		for (const line of this.currentLyricLineObjects) {
			line.update(delta / 1000);
		}

		ctx.restore();

		ctx.font = `15px ${this.baseFontFamily}`;
		ctx.fillStyle = "#FFFFFF55";
		ctx.textAlign = "right";
		ctx.fillText("CanvasLyricPlayer 播放器", width - 16, height - 16);
	}
}

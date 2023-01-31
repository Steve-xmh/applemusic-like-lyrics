import { LyricLine } from "../../core/lyric-parser";
import { Spring } from "../../utils/spring";
import { log } from "../../utils/logger";
import { splitMultilineText } from "../../libs/canvas-hypertext";

type LyricLineState = LyricLine & {
	vSpring: Spring;
	drawTextCache: string[];
	height: number;
	isOutOfSight: boolean;
};

export class CanvasLyricRender {
	private disposed = false;
	private frameId = 0;
	private currentLyrics: LyricLineState[] = [];
	private lineHeight = 0;
	private currentLyricIndex = 0;
	private ctx: CanvasRenderingContext2D;
	private fontSizeValue: string = "";
	private readonly onFrame = () => {
		if (!this.disposed) {
			this.onUpdateAndDraw();
		}
	};

	constructor(readonly canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext("2d");
		if (ctx) {
			this.ctx = ctx;
			ctx.textBaseline = "top";
			ctx.textAlign = "left";
			ctx.fontKerning = "auto";
			this.setFontSize(32);
		} else {
			throw new TypeError("你的网易云/系统不支持 Canvas 歌词渲染后端！");
		}
	}

	setFontSize(dpSize: number) {
		const ctx = this.ctx;
		this.fontSizeValue = `${dpSize * window.devicePixelRatio}px "PingFang SC"`;
		ctx.font = this.fontSizeValue;
		ctx.fillStyle = "white";
		const metrics = ctx.measureText(
			"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ中文",
		);
		this.lineHeight =
			metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
		this.updateLayout();
		this.shouldRedraw();
	}

	setLyric(lyrics: LyricLine[]) {
		this.currentLyrics = lyrics.map((v, i) => ({
			...v,
			vSpring: new Spring(i),
			drawTextCache: [],
			height: 0,
			isOutOfSight: false,
		}));
		this.updateLayout();
		this.shouldRedraw();
	}

	setCurrentLyricIndex(index: number) {
		this.currentLyricIndex = index;
		const thisLine = this.currentLyrics[this.currentLyricIndex];
		if (thisLine?.isOutOfSight) {
			this.updateSprings();
		} else {
			this.stepUpdateSprings();
		}
		this.shouldRedraw();
	}

	updateLayout() {
		const width = this.canvas.width;
		this.ctx.font = this.fontSizeValue;
		for (const line of this.currentLyrics) {
			line.drawTextCache = [
				...splitMultilineText(
					this.ctx,
					line.originalLyric,
					this.fontSizeValue,
					width * 0.9,
				),
			];
			if (line.drawTextCache.join("\n").trim().length > 0) {
				line.height =
					this.lineHeight * line.drawTextCache.length +
					16 * window.devicePixelRatio;
			} else {
				line.height = 0;
			}
		}
		this.updateSprings(true);
	}

	private updateSpringForLine(index: number, resetSpringPosition = false) {
		const line = this.currentLyrics[index];

		if (line) {
			const offset = index - this.currentLyricIndex;
			const distance = Math.abs(offset);
			const sign = offset < 0 ? -1 : 1;
			let targetPosition = 0;

			if (sign === -1) {
				targetPosition -= line.height;
			}

			for (let o = sign === 1 ? 0 : 1; o < distance; o++) {
				const l = this.currentLyrics[this.currentLyricIndex + o * sign];
				if (l) {
					targetPosition += l.height * sign;
				} else {
					break;
				}
			}

			if (line.isOutOfSight || resetSpringPosition) {
				line.vSpring = new Spring(targetPosition);
			} else {
				line.vSpring.target = targetPosition;
			}
		}
	}

	private stepUpdateSpringsHandle = 0;
	stepUpdateSprings(offset = 0, step = 1) {
		if (this.stepUpdateSpringsHandle && offset === 0) {
			cancelAnimationFrame(this.stepUpdateSpringsHandle);
			this.stepUpdateSpringsHandle = 0;
		}

		if (offset === 0 && step === 1) {
			const thisLine = this.currentLyrics[this.currentLyricIndex];
			if (thisLine) {
				thisLine.vSpring.target = 0;
			}
			this.stepUpdateSpringsHandle = requestAnimationFrame(() =>
				this.stepUpdateSprings(offset + step, step),
			);
		} else {
			let meetEnd = false;

			for (let stepOffset = 0; stepOffset < step; stepOffset++) {
				const lowLine =
					this.currentLyrics[this.currentLyricIndex - offset - stepOffset];

				if (lowLine) {
					this.updateSpringForLine(
						this.currentLyricIndex - offset - stepOffset,
					);
				}

				const highLine =
					this.currentLyrics[this.currentLyricIndex + offset + stepOffset];

				if (highLine) {
					this.updateSpringForLine(
						this.currentLyricIndex + offset + stepOffset,
					);
				}

				if (!(lowLine || highLine)) {
					meetEnd = true;
					break;
				}
			}

			if (!meetEnd) {
				this.stepUpdateSpringsHandle = requestAnimationFrame(() =>
					this.stepUpdateSprings(offset + Math.floor(step), step + 0.2),
				);
			}
		}
	}

	updateSprings(resetSpringPosition = false) {
		for (let i = 0; i < this.currentLyrics.length; i++) {
			this.updateSpringForLine(i, resetSpringPosition);
		}
	}

	onUpdateAndDraw() {
		this.frameId = 0;
		let allArrived = true;
		const width = this.canvas.width;
		const height = this.canvas.height;

		const ctx = this.ctx;
		if (ctx.font !== this.fontSizeValue) {
			ctx.font = this.fontSizeValue;
		}
		ctx.textBaseline = "top";
		ctx.textAlign = "left";
		ctx.fillStyle = "white";
		ctx.clearRect(0, 0, width, height);

		// ctx.strokeStyle = "green";
		// ctx.strokeRect(0, height / 2, width, 1);

		// ctx.strokeStyle = "red";
		for (let i = 0; i < this.currentLyrics.length; i++) {
			const line = this.currentLyrics[i];

			if (i === this.currentLyricIndex) {
				ctx.fillStyle = "white";
			} else {
				ctx.fillStyle = "#FFF7";
			}

			allArrived &&= line.vSpring.arrived;
			const top = line.vSpring.position + height / 2;
			const bottom = top + line.height;
			if (top < height * 1.5 && bottom > height / -2) {
				line.isOutOfSight = false;
				let t = top;
				// ctx.strokeRect(0, t, width, line.height);
				for (const l of line.drawTextCache) {
					ctx.fillText(l, 0, t);
					t += this.lineHeight;
				}
			} else {
				line.isOutOfSight = true;
			}
		}

		if (!allArrived) {
			this.shouldRedraw();
		}
	}

	shouldRedraw() {
		if (!this.frameId) {
			this.frameId = requestAnimationFrame(this.onFrame);
		}
	}

	dispose() {
		if (this.frameId) {
			cancelAnimationFrame(this.frameId);
			this.frameId = 0;
		}
		this.disposed = true;
	}
}

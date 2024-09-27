import type { CanvasLyricPlayer } from ".";
import type { LyricLine } from "../../interfaces";
import { chunkAndSplitLyricWords } from "../../utils/lyric-split-words";
import { LyricLineBase } from "../base";
import {
	type TextLayoutConfig,
	type TextLayoutResult,
	layoutLine,
} from "./text-layout";

export class CanvasLyricLine extends LyricLineBase {
	constructor(
		private player: CanvasLyricPlayer,
		private line: LyricLine = {
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
		this.relayout();
	}

	override getLine(): LyricLine {
		return this.line;
	}
	private lineSize: [number, number] = [0, 0];
	override measureSize(): [number, number] {
		const maxMainLineIndex = Math.max(
			0,
			...this.layoutWords.flat().map((w) => w.lineIndex + 1),
		);
		const maxTranslatedLineIndex = Math.max(
			0,
			...this.translatedLayoutWords.map((w) => w.lineIndex + 1),
		);
		const maxRomanLineIndex = Math.max(
			0,
			...this.romanLayoutWords.map((w) => w.lineIndex + 1),
		);
		const lineHeight = this.player.baseFontSize;
		this.lineSize = [
			this.player.size[0],
			(maxMainLineIndex + maxTranslatedLineIndex + maxRomanLineIndex) *
				lineHeight +
				this.player.size[1] * 0.04,
		];
		return [...this.lineSize];
	}

	private layoutWords: TextLayoutResult[][] = [];
	private translatedLayoutWords: TextLayoutResult[] = [];
	private romanLayoutWords: TextLayoutResult[] = [];
	/** @internal */
	relayout(): void {
		const config: TextLayoutConfig = {
			fontSize: this.player.baseFontSize,
			maxWidth: this.player.size[0] - 50,
			lineHeight: this.player.baseFontSize,
			uniformSpace: true,
		};
		const ctx = this.player.ctx;
		this.player.setFontSize(1);
		for (const chunk of chunkAndSplitLyricWords(this.line.words)) {
			if (Array.isArray(chunk)) {
				if (chunk.length === 0) continue;
			} else {
			}
		}
		this.layoutWords = [
			[...layoutLine(ctx, this.line.words.map((w) => w.word).join(""), config)],
		];
		this.player.setFontSize(0.5);
		this.translatedLayoutWords = [
			...layoutLine(ctx, this.line.translatedLyric, config),
		];
		this.romanLayoutWords = [...layoutLine(ctx, this.line.romanLyric, config)];
	}
	private enabled = false;
	override enable(): void {
		this.enabled = true;
	}
	override disable(): void {
		this.enabled = false;
	}
	override resume(): void {}
	override pause(): void {}
	override setTransform(
		left = this.left,
		top = this.top,
		scale = this.scale,
		opacity = this.opacity,
		blur = this.blur,
		force = false,
		delay = this.delay,
	): void {
		const targetBlur = Math.min(32, blur);
		// TODO: 实现模糊效果和不透明度效果的动画化
		this.blur = targetBlur;
		this.opacity = opacity;
		if (force) {
			this.lineTransforms.posX.setPosition(left);
			this.lineTransforms.posY.setPosition(top);
			this.lineTransforms.scale.setPosition(scale);
		} else {
			this.lineTransforms.posX.setTargetPosition(left, delay);
			this.lineTransforms.posY.setTargetPosition(top, delay);
			this.lineTransforms.scale.setTargetPosition(scale);
		}
	}
	get isInSight() {
		const l = this.lineTransforms.posX.getCurrentPosition();
		const t = this.lineTransforms.posY.getCurrentPosition();
		const r = l + this.lineSize[0];
		const b = t + this.lineSize[1];
		const pr = this.player.size[0];
		const pb = this.player.size[1];
		return !(l > pr || t > pb || r < 0 || b < 0);
	}
	override update(delta?: number): void {
		this.lineTransforms.posX.update(delta);
		this.lineTransforms.posY.update(delta);
		this.lineTransforms.scale.update(delta);
		if (!this.isInSight) return;
		const ctx = this.player.ctx;
		ctx.save();
		ctx.fillStyle = "white";
		ctx.filter = `blur(${this.blur}px)`;
		ctx.textRendering = "geometricPrecision";
		this.player.setFontSize(1);
		ctx.translate(
			this.lineTransforms.posX.getCurrentPosition(),
			this.lineTransforms.posY.getCurrentPosition(),
		);
		const scale = this.lineTransforms.scale.getCurrentPosition() / 100;
		ctx.scale(scale, scale);
		ctx.globalAlpha = this.opacity * (this.enabled ? 1 : 0.5);
		let lineIndex = 0;
		for (const word of this.layoutWords) {
			for (const layout of word) {
				ctx.fillText(
					layout.text,
					layout.x,
					layout.lineIndex *
						this.player.baseFontSize *
						this.player.baseLineHeight,
				);
				lineIndex = layout.lineIndex;
			}
		}
		ctx.translate(0, (lineIndex + 1) * this.player.baseFontSize);
		this.player.setFontSize(0.5);
		ctx.globalAlpha = this.opacity * 0.5 * (this.enabled ? 1 : 0.5);
		lineIndex = 0;
		for (const layout of this.translatedLayoutWords) {
			ctx.fillText(
				layout.text,
				layout.x,
				layout.lineIndex *
					this.player.baseFontSize *
					this.player.baseLineHeight,
			);
			lineIndex = layout.lineIndex;
		}
		ctx.translate(0, (lineIndex + 1) * this.player.baseFontSize);
		for (const layout of this.romanLayoutWords) {
			ctx.fillText(
				layout.text,
				layout.x,
				layout.lineIndex *
					this.player.baseFontSize *
					this.player.baseLineHeight,
			);
		}
		ctx.restore();
	}
}

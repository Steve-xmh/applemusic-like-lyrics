import { LyricPlayer } from ".";
import { Disposable, HasElement } from "../interfaces";
import { Spring } from "../utils/spring";

export class BottomLineEl implements HasElement, Disposable {
	private element: HTMLElement = document.createElement("div");
	private left = 0;
	private top = 0;
	private delay = 0;
	// 由 LyricPlayer 来设置
	lineSize: number[] = [0, 0];
	readonly lineTransforms = {
		posX: new Spring(0),
		posY: new Spring(0),
	};
	constructor(private lyricPlayer: LyricPlayer) {
		this.element.setAttribute(
			"class",
			this.lyricPlayer.style.classes.lyricLine,
		);
		this.rebuildStyle();
	}
	measureSize(): [number, number] {
		const size: [number, number] = [
			this.element.clientWidth,
			this.element.clientHeight,
		];
		return size;
	}
	private lastStyle = "";
	show() {
		this.rebuildStyle();
	}
	hide() {
		this.rebuildStyle();
	}
	rebuildStyle() {
		let style = `transform:translate(${this.lineTransforms.posX
			.getCurrentPosition()
			.toFixed(2)}px,${this.lineTransforms.posY
			.getCurrentPosition()
			.toFixed(2)}px);`;
		if (!this.lyricPlayer.getEnableSpring() && this.isInSight) {
			style += `transition-delay:${this.delay}ms;`;
		}
		if (style !== this.lastStyle) {
			this.lastStyle = style;
			this.element.setAttribute("style", style);
		}
	}
	getElement() {
		return this.element;
	}
	setTransform(
		left: number = this.left,
		top: number = this.top,
		force = false,
		delay = 0,
	) {
		this.left = left;
		this.top = top;
		this.delay = (delay * 1000) | 0;
		if (force || !this.lyricPlayer.getEnableSpring()) {
			if (force)
				this.element.classList.add(
					this.lyricPlayer.style.classes.tmpDisableTransition,
				);
			this.lineTransforms.posX.setPosition(left);
			this.lineTransforms.posY.setPosition(top);
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
		}
	}
	update(delta = 0) {
		if (!this.lyricPlayer.getEnableSpring()) return;
		this.lineTransforms.posX.update(delta);
		this.lineTransforms.posY.update(delta);
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
		const pr = this.lyricPlayer.size[0];
		const pb = this.lyricPlayer.size[1];
		return !(l > pr || t > pb || r < 0 || b < 0);
	}
	dispose(): void {
		this.element.remove();
	}
}

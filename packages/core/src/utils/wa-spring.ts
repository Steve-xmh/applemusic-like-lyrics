import { Disposable } from "..";
import bezier from "bezier-easing";

export interface SpringParams {
	mass: number; // = 1.0
	damping: number; // = 10.0
	stiffness: number; // = 100.0
}

type seconds = number;

type CSSStyleKeys = {
	[Style in keyof CSSStyleDeclaration]: Style extends string
		? CSSStyleDeclaration[Style] extends string
			? Style
			: never
		: never;
}[keyof CSSStyleDeclaration];

/**
 * 基于 Web Animation API 的弹簧动画工具类，效果上可能逊于实时演算的版本
 */
export class WebAnimationSpring extends EventTarget implements Disposable {
	private currentAnimation: Animation | null = null;
	private targetPosition: number = 0;
	private params: Partial<SpringParams> = {};
	private currentSolver: (t: seconds) => number = () => this.targetPosition;
	private getV: (t: seconds) => number = () => 0;

	constructor(
		private element: HTMLElement,
		private styleName: CSSStyleKeys,
		private valueGenerator: (value: number) => string,
		private currentPosition: number = 0,
	) {
		super();
		this.targetPosition = currentPosition;
	}

	setTargetPosition(targetPosition: number) {}

	getCurrentPosition() {
		if (this.currentAnimation?.currentTime) {
			const t = (this.currentAnimation.currentTime as number) / 1000;
			return this.currentSolver(t);
		} else {
			return this.currentPosition;
		}
	}

	getCurrentVelocity() {
		if (this.currentAnimation?.currentTime) {
			const t = (this.currentAnimation.currentTime as number) / 1000;
			return this.getV(t);
		} else {
			return 0;
		}
	}

	private onStepFinished() {
		if (Math.abs(this.targetPosition - this.getCurrentPosition()) < 0.01) {
			this.stop();
			this.dispatchEvent(new Event("finished"));
			return;
		}
	}

	stop() {
		if (this.currentAnimation) {
			this.currentAnimation.cancel();
			this.element.style[this.styleName] = this.valueGenerator(
				this.getCurrentPosition(),
			);
			this.currentAnimation = null;
		}
	}

	dispose() {
		this.stop();
	}
}

/**
 * @fileoverview
 * 一个与调用时间无关的单维弹簧动画对象
 *
 * 优点是调用次数无关，可以在任意时间计算出当前时间的弹簧末端位置，非常方便
 */

export class Spring {
	private _startTime = this.curTime;
	private _damper = 0.9;
	private _speed = 0.7;
	private _target = 0;
	private _position = 0;
	private _velocity = 0;
	constructor(initialPosition: number) {
		this._position = this._target = initialPosition;
	}
	private get curTime() {
		return Date.now() / 1000;
	}

	private positionVelocity(): [number, number] {
		const x = this.curTime - this._startTime;
		const c0 = this._position - this._target;
		if (this._speed === 0) {
			return [this._position, 0];
		} else if (this._damper < 1) {
			const c = Math.sqrt(1 - Math.pow(this._damper, 2));
			const c1 = (this._velocity / this._speed + this._damper * c0) / c;
			const co = Math.cos(c * this._speed * x);
			const si = Math.sin(c * this._speed * x);
			const e = Math.pow(Math.E, this._damper * this._speed * x);
			return [
				this._target + (c0 * co + c1 * si) / e,
				(this._speed *
					((c * c1 - this._damper * c0) * co -
						(c * c0 + this._damper * c1) * si)) /
					e,
			];
		} else {
			const c1 = this._velocity / this._speed + c0;
			const e = Math.pow(Math.E, this._speed * x);
			return [
				this._target + (c0 + c1 * this._speed * x) / e,
				(this._speed * (c1 - c0 - c1 * this._speed * x)) / e,
			];
		}
	}

	private resetTime() {
		this._startTime = this.curTime;
	}

	get arrived() {
		const [pos, vel] = this.positionVelocity();
		return (
			Math.abs(Math.round(pos * 100) - Math.round(this._target * 100)) <
				Number.EPSILON && Math.round(vel * 100) === 0
		);
	}

	set position(v: number) {
		const r = this.positionVelocity();
		this._position = v;
		this._velocity = r[1];
		this.resetTime();
	}

	get position() {
		const [pos, vel] = this.positionVelocity();
		this._position = pos;
		this._velocity = vel;
		return pos;
	}

	get positionRounded() {
		return Math.round(this.position);
	}

	set velocity(v: number) {
		const r = this.positionVelocity();
		this._position = r[0];
		this._velocity = v;
		this.resetTime();
	}

	get damper() {
		return this._damper;
	}

	set damper(v: number) {
		this._damper = v;
		this.resetTime();
	}

	get velocity() {
		const [pos, vel] = this.positionVelocity();
		this._position = pos;
		this._velocity = vel;
		return vel;
	}

	set speed(v: number) {
		const [pos, vel] = this.positionVelocity();
		this._position = pos;
		this._velocity = vel;
		this._speed = v;
		this.resetTime();
	}

	set target(v: number) {
		const [pos, vel] = this.positionVelocity();
		this._position = pos;
		this._velocity = vel;
		this._target = v;
		this.resetTime();
	}
}

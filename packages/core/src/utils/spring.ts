/** MIT License github.com/pushkine/ */
export interface SpringParams {
	mass: number; // = 1.0
	damping: number; // = 10.0
	stiffness: number; // = 100.0
	soft: boolean; // = false
}

type seconds = number;

export class Spring {
	private currentPosition = 0;
	private targetPosition = 0;
	private currentTime = 0;
	private params: Partial<SpringParams> = {};
	private currentSolver: (t: seconds) => number;
	private getV: (t: seconds) => number;
	private queueParams: (Partial<SpringParams> & {
		time: number;
	})[] = [];
	private queuePosition: {
		time: number;
		position: number;
	}[] = [];
	constructor(currentPosition = 0) {
		this.targetPosition = currentPosition;
		this.currentPosition = this.targetPosition;
		this.currentSolver = () => this.targetPosition;
		this.getV = () => 0;
	}
	private resetSolver() {
		const curV = this.getV(this.currentTime);
		this.currentTime = 0;
		this.currentSolver = solveSpring(
			this.currentPosition,
			curV,
			this.targetPosition,
			0,
			this.params,
		);
		this.getV = getVelocity(this.currentSolver);
	}
	setPosition(targetPosition: number) {
		this.targetPosition = targetPosition;
		this.currentPosition = targetPosition;
		this.currentSolver = () => this.targetPosition;
		this.getV = () => 0;
	}
	update(delta = 0) {
		this.currentTime += delta;
		this.currentPosition = this.currentSolver(this.currentTime);
		const nextParams = this.queueParams[0];
		if (nextParams) {
			this.queueParams.forEach((p) => {
				p.time -= delta;
			});
			if (nextParams.time <= 0) {
				this.updateParams({
					mass: nextParams.mass,
					damping: nextParams.damping,
					stiffness: nextParams.stiffness,
					soft: nextParams.soft,
				});
				this.queueParams.shift();
			}
		}
		const nextPosition = this.queuePosition[0];
		if (nextPosition) {
			this.queuePosition.forEach((p) => {
				p.time -= delta;
			});
			if (nextPosition.time <= 0) {
				this.setTargetPosition(nextPosition.position);
				this.queuePosition.shift();
			}
		}
	}
	updateParams(params: Partial<SpringParams>, delay = 0) {
		if (delay > 0) {
			this.queueParams = this.queueParams.filter((v) => v.time < delay);
			this.queueParams.push({
				...params,
				time: delay,
			});
		} else {
			this.params = {
				...this.params,
				...params,
			};
			this.resetSolver();
		}
	}
	setTargetPosition(targetPosition: number, delay = 0) {
		if (delay > 0) {
			this.queuePosition = this.queuePosition.filter((v) => v.time < delay);
			this.queuePosition.push({
				position: targetPosition,
				time: delay,
			});
		} else {
			this.targetPosition = targetPosition;
			this.resetSolver();
		}
	}
	getCurrentPosition() {
		return this.currentPosition;
	}
}

function solveSpring(
	from: number,
	velocity: number,
	to: number,
	delay: seconds = 0,
	params: Partial<SpringParams>,
): (t: seconds) => number {
	const soft = params.soft ?? false;
	const stiffness = params.stiffness ?? 100;
	const damping = params.damping ?? 10;
	const mass = params.mass ?? 1;
	const delta = to - from;
	if (soft || 1.0 <= damping / (2.0 * Math.sqrt(stiffness * mass))) {
		const angular_frequency = -Math.sqrt(stiffness / mass);
		const leftover = -angular_frequency * delta - velocity;
		return (t: seconds) => {
			t -= delay;
			if (t < 0) return from;
			return to - (delta + t * leftover) * Math.E ** (t * angular_frequency);
		};
	} else {
		const damping_frequency = Math.sqrt(
			4.0 * mass * stiffness - damping ** 2.0,
		);
		const leftover =
			(damping * delta - 2.0 * mass * velocity) / damping_frequency;
		const dfm = (0.5 * damping_frequency) / mass;
		const dm = -(0.5 * damping) / mass;
		return (t: seconds) => {
			t -= delay;
			if (t < 0) return from;
			return (
				to -
				(Math.cos(t * dfm) * delta + Math.sin(t * dfm) * leftover) *
					Math.E ** (t * dm)
			);
		};
	}
}

function derivative(f: (x: number) => number) {
	const h = 0.001;
	return (x: number) => (f(x + h) - f(x - h)) / (2 * h);
}

function getVelocity(f: (t: seconds) => number): (t: seconds) => number {
	return derivative(f);
}

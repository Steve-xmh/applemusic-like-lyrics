/** MIT License github.com/pushkine/ */
export interface SpringParams {
	mass?: number; // = 1.0
	damping?: number; // = 10.0
	stiffness?: number; // = 100.0
	soft?: boolean; // = false
}

type seconds = number;

export default function solveSpring(
	from: number,
	velocity: number,
	to: number,
	delay: seconds = 0,
	params: SpringParams,
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

export function getVelocity(f: (t: seconds) => number): (t: seconds) => number {
	return derivative(f);
}

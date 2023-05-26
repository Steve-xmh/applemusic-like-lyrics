/**
 * @fileoverview
 * 从 Svelte 库移植过来的弹簧模块
 */

import React from "react";
import { log } from "./logger";

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
function isDate(obj: any): obj is Date {
	return Object.prototype.toString.call(obj) === "[object Date]";
}

let loopHandle = 0;
let loopHandlers: {
	callback: (t: number) => boolean;
	resolve: Function;
}[] = [];
const loopFrameHandler = () => {
	const time = now();
	loopHandlers = loopHandlers.filter((fn) => {
		if (fn.callback(time)) {
			return true;
		} else {
			fn.resolve();
			return false;
		}
	});
	if (loopHandlers.length > 0) {
		loopHandle = requestAnimationFrame(loopFrameHandler);
	} else {
		loopHandle = 0;
	}
};
const loop = (callback: (t: number) => boolean) => {
	const promise = new Promise<void>((resolve) => {
		loopHandlers.push({
			callback,
			resolve,
		});
	});
	if (loopHandle === 0) {
		loopHandle = requestAnimationFrame(loopFrameHandler);
	}
	return {
		promise,
	};
};

const now = () => Date.now();

interface TickContext<T> {
	invMass: number;
	dt: number;
	opts: Spring<T>;
	settled: boolean;
}

function tickSpring<T>(
	ctx: TickContext<T>,
	lastValue: T,
	currentValue: T,
	targetValue: T,
): T {
	if (typeof currentValue === "number" || isDate(currentValue)) {
		// @ts-ignore
		const delta = targetValue - currentValue;
		// @ts-ignore
		const velocity = (currentValue - lastValue) / (ctx.dt || 1 / 60); // guard div by 0
		const spring = ctx.opts.stiffness * delta;
		const damper = ctx.opts.damping * velocity;
		const acceleration = (spring - damper) * ctx.invMass;
		const d = (velocity + acceleration) * ctx.dt;

		if (
			Math.abs(d) < ctx.opts.precision &&
			Math.abs(delta) < ctx.opts.precision
		) {
			return targetValue; // settled
		} else {
			ctx.settled = false; // signal loop to keep ticking
			// @ts-ignore
			return isDate(currentValue)
				? new Date(currentValue.getTime() + d)
				: currentValue + d;
		}
	} else if (Array.isArray(currentValue)) {
		// @ts-ignore
		return currentValue.map((_, i) =>
			tickSpring(ctx, lastValue[i], currentValue[i], targetValue[i]),
		);
	} else if (typeof currentValue === "object") {
		const nextValue = {};
		for (const k in currentValue) {
			// @ts-ignore
			nextValue[k] = tickSpring(
				ctx,
				// @ts-ignore
				lastValue[k],
				currentValue[k],
				targetValue[k],
			);
		}
		// @ts-ignore
		return nextValue;
	} else {
		throw new Error(`Cannot spring ${typeof currentValue} values`);
	}
}

interface SpringOpts {
	stiffness?: number;
	damping?: number;
	precision?: number;
}

interface SpringUpdateOpts {
	// rome-ignore lint/suspicious/noExplicitAny: <explanation>
	hard?: any;
	soft?: string | number | boolean;
}

export interface Spring<T> {
	set: (newValue: T, opts?: SpringUpdateOpts) => Promise<void>;
	onUpdate: (newOnUpdate: (value: T) => void) => void;
	precision: number;
	damping: number;
	stiffness: number;
}

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
export function useSpring<T = any>(
	value: T,
	opts: SpringOpts = {},
	onUpdate: (value: T) => void = () => {},
): React.MutableRefObject<Spring<T>> {
	const springRef = React.useRef() as React.MutableRefObject<Spring<T>>;

	if (!springRef.current) {
		const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;

		let lastTime: number;
		let task: ReturnType<typeof loop> | null;
		let lastValue: T = value;
		let targetValue: T = value;
		let currentToken = {};

		let invMass = 1;
		let invMassRecoveryRate = 0;
		let cancelTask = false;

		function set(newValue: T, opts: SpringUpdateOpts = {}) {
			targetValue = newValue;
			const token = (currentToken = {});

			if (
				value == null ||
				opts.hard ||
				(spring.stiffness >= 1 && spring.damping >= 1)
			) {
				cancelTask = true; // cancel any running animation
				lastTime = now();
				lastValue = newValue;
				onUpdate((value = targetValue));
				return Promise.resolve();
			} else if (opts.soft) {
				const rate = opts.soft === true ? 0.5 : +opts.soft;
				invMassRecoveryRate = 1 / (rate * 60);
				invMass = 0; // infinite mass, unaffected by spring forces
			}

			if (!task) {
				lastTime = now();
				cancelTask = false;

				task = loop((now) => {
					if (cancelTask) {
						cancelTask = false;
						task = null;
						return false;
					}

					invMass = Math.min(invMass + invMassRecoveryRate, 1);

					const ctx: TickContext<T> = {
						invMass: invMass,
						opts: spring,
						settled: true, // tickSpring may signal false
						dt: ((now - lastTime) * 60) / 1000,
					};
					const nextValue = tickSpring(ctx, lastValue, value, targetValue);

					lastTime = now;
					lastValue = value;
					onUpdate((value = nextValue));

					if (ctx.settled) {
						task = null;
					}
					return !ctx.settled;
				});
			}

			return new Promise<void>((fulfil) => {
				task?.promise.then(() => {
					if (token === currentToken) fulfil();
				});
			});
		}

		const spring: Spring<T> = {
			set,
			onUpdate: (newOnUpdate) => {
				onUpdate = newOnUpdate;
			},
			stiffness,
			damping,
			precision,
		};
		springRef.current = spring;
	}

	return springRef;
}

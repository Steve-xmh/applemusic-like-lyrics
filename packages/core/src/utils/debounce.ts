// biome-ignore lint/complexity/noBannedTypes: for debounce function
export function debounce<T extends Function>(cb: T, wait = 20) {
	let h = 0;
	// biome-ignore lint/suspicious/noExplicitAny: function can be any
	const callable = (...args: any) => {
		clearTimeout(h);
		h = setTimeout(() => cb(...args), wait);
	};
	return callable;
}

// biome-ignore lint/complexity/noBannedTypes: for debounce function
export function debounceFrame<T extends Function>(cb: T, frameTime = 1) {
	let h = 0;
	let ft = frameTime;
	// biome-ignore lint/suspicious/noExplicitAny: function can be any
	const callable = (...args: any) => {
		ft = frameTime;
		cancelAnimationFrame(h);
		const onCB = () => {
			if (--ft <= 0) {
				cb(...args);
			} else {
				h = requestAnimationFrame(onCB);
			}
		};
		h = requestAnimationFrame(onCB);
	};
	return callable;
}

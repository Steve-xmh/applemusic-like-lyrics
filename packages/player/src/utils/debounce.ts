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

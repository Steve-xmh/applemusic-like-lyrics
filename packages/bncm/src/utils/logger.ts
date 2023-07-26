export function log(...args: Parameters<typeof console.log>) {
	if (import.meta.env.AMLL_DEV) {
		console.log("%c[AMLL]", "color:#2AF", ...args);
	}
}

export function warn(...args: Parameters<typeof console.log>) {
	if (import.meta.env.AMLL_DEV) {
		console.log("%c[AMLL] %c[WARN]", "color:#2AF", "color:#F82", ...args);
	}
}

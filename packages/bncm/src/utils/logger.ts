export function log(...args: Parameters<typeof console.log>) {
	if (location.hostname === "localhost") {
		console.log("%c[AMLL]", "color:#2AF", ...args);
	}
	if (import.meta.env.AMLL_DEV) {
		console.log("%c[AMLL]", "color:#2AF", ...args);
	}
}

export function warn(...args: Parameters<typeof console.warn>) {
	if (location.hostname === "localhost") {
		console.log("%c[AMLL] %c[WARN]", "color:#2AF", "color:#F82", ...args);
	}
	if (import.meta.env.AMLL_DEV) {
		console.log("%c[AMLL] %c[WARN]", "color:#2AF", "color:#F82", ...args);
	}
}

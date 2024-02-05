export function debounce<T extends Function>(callback: T, waitTime: number): T {
	let timer = 0;
	return function debounceClosure() {
		const self = this;
		// biome-ignore lint/style/noArguments: 防抖函数
		const args = arguments;
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(callback.bind(self, ...args), waitTime);
	} as unknown as T;
}

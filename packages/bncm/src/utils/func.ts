let cachedFunctionMap: Map<string, Function> = new Map();

// rome-ignore lint/suspicious/noExplicitAny: 函数类型可随意
export function callCachedSearchFunction<F extends (...args: any[]) => any,>(
	searchFunctionName: string | ((func: Function) => boolean),
	args: Parameters<F>,
): ReturnType<F> {
	cachedFunctionMap ??= new Map(); // 很神奇，不知道为什么此处会炸
	if (!cachedFunctionMap.has(searchFunctionName.toString())) {
		const findResult = betterncm.ncm.findApiFunction(searchFunctionName);
		if (findResult) {
			const [func, funcRoot] = findResult;
			cachedFunctionMap.set(searchFunctionName.toString(), func.bind(funcRoot));
		}
	}
	const cachedFunc = cachedFunctionMap.get(searchFunctionName.toString());
	if (cachedFunc) {
		return cachedFunc.apply(null, args);
	} else {
		throw new TypeError(`函数 ${searchFunctionName.toString()} 未找到`);
	}
}

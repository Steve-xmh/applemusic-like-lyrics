let cachedFunctionMap: Map<string, Function> = new Map();

// biome-ignore lint/suspicious/noExplicitAny: 函数类型可随意
export function callCachedSearchFunction<F extends (...args: any[]) => any>(
	searchFunctionName:
		| string
		| ((func: Function, funcPath: string[]) => boolean),
	args: Parameters<F>,
	// biome-ignore lint/suspicious/noExplicitAny: 根对象可以是任意的
	root: any = window,
	currentPath = ["window"],
): ReturnType<F> {
	cachedFunctionMap ??= new Map(); // 很神奇，不知道为什么此处会炸
	if (!cachedFunctionMap.has(searchFunctionName.toString())) {
		const findResult = searchApiFunction(searchFunctionName, root, currentPath);
		if (findResult[0]) {
			const [func, funcRoot] = findResult[0];
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

// 遍历对象的键，包含原型链上的键
function* getKeys(obj: any) {
	for (const key in obj) {
		yield key;
	}
	if ("__proto__" in obj && obj.__proto__ !== Object.prototype) {
		yield* getKeys(obj["__proto__"]);
	}
}

export function searchApiFunction(
	nameOrFinder: string | ((func: Function, funcPath: string[]) => boolean),
	// biome-ignore lint/suspicious/noExplicitAny: 根对象可以是任意的
	root: any = window,
	currentPath = ["window"],
	// biome-ignore lint/suspicious/noExplicitAny: 已检索对象可以是任意的
	prevObjects: any[] = [],
	// biome-ignore lint/suspicious/noExplicitAny: 返回该函数的携带对象，方便做 bind 绑定
	result: [Function, any, string[]][] = [],
	traveledObjects: Set<any> = new Set(),
	// biome-ignore lint/suspicious/noExplicitAny: 返回该函数的携带对象，方便做 bind 绑定
): [Function, any, string[]][] {
	if (root === undefined || root === null) {
		return result;
	}
	prevObjects.push(root);
	if (typeof nameOrFinder === "string") {
		if (typeof root[nameOrFinder] === "function") {
			result.push([root[nameOrFinder], root, [...currentPath, nameOrFinder]]);
		}
	} else {
		for (const key of getKeys(root)) {
			if (typeof root[key] === "function") {
				if (traveledObjects.has(root[key])) continue;
				traveledObjects.add(root[key]);
				// console.log(`${currentPath.join(".")}.${key}`);
				const newPath = [...currentPath, key];
				if (nameOrFinder(root[key], newPath)) {
					result.push([root[key], root, newPath]);
				}
			}
		}
	}
	if (currentPath.length < 10) {
		for (const key of getKeys(root)) {
			if (
				typeof root[key] === "object" &&
				// Object.hasOwn(root, key) &&
				!prevObjects.includes(root[key]) &&
				!(
					currentPath.length === 1 &&
					prevObjects[prevObjects.length - 1] === window &&
					key === "betterncm"
				) // 咱们自己的函数就不需要检测了
			) {
				if (traveledObjects.has(root[key])) continue;
				traveledObjects.add(root[key]);
				currentPath.push(key);
				searchApiFunction(
					nameOrFinder,
					root[key],
					currentPath,
					prevObjects,
					result,
					traveledObjects,
				);
				currentPath.pop();
			}
		}
	}
	prevObjects.pop();
	return result;
}

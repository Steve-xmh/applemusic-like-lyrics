export const eqSet: <T>(xs: Set<T>, ys: Set<T>) => boolean = (
	xs,
	ys,
): boolean => xs.size === ys.size && [...xs].every((x) => ys.has(x));

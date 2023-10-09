import { atom, WritableAtom } from "jotai";
import { selectAtom } from "jotai/utils";

export function focusAtom<Value, Result, Field extends keyof Awaited<Value>>(
	anAtom: WritableAtom<Value, [Awaited<Value>], Result>,
	key: Field,
) {
	const getAtom = selectAtom(anAtom, (v) => v[key]);
	return atom(
		(get) => get(getAtom),
		async (get, set, value: Awaited<Value>[Field]) => {
			const v = get(anAtom);
			if (v instanceof Promise) {
				const obj: Awaited<Value> = Object.assign({}, await v);
				obj[key] = value;
				set(anAtom, obj);
			} else {
				const av = v as Awaited<Value>;
				const obj: Awaited<Value> = Object.assign({}, av);
				obj[key] = value;
				set(anAtom, obj);
				return Promise.resolve();
			}
		},
	);
}

import { log } from "./logger";

const registeredEvt = new Set<string>();
const callbacks = new Map<string, Set<Function>>();

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
const onRegisterCallEvent = (name: string, args: any[]) => {
	for (const callback of callbacks.get(name) ?? []) {
		callback(...args);
	}
};

export const appendRegisterCall = (
	name: string,
	namespace: string,
	callback: Function,
) => appendRegisterCallRaw(`${namespace}.on${name}`, callback);

export const appendRegisterCallRaw = (name: string, callback: Function) => {
	if (!registeredEvt.has(name)) {
		registeredEvt.add(name);
		channel.registerCall(name, (...args) => {
			onRegisterCallEvent(name, args);
		});
	}
	if (!callbacks.has(name)) callbacks.set(name, new Set());
	callbacks.get(name)?.add(callback);
};

export const removeRegisterCall = (
	name: string,
	namespace: string,
	callback: Function,
) => removeRegisterCallRaw(`${namespace}.on${name}`, callback);

export const removeRegisterCallRaw = (name: string, callback: Function) => {
	if (callbacks.has(name)) {
		callbacks.get(name)?.delete(callback);
		if (callbacks.get(name)?.size === 0) callbacks.delete(name);
	}
};

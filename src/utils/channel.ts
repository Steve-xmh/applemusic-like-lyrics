import { isNCMV3 } from ".";
import { warn } from "./logger";

const registeredEvt = new Set<string>();
const callbacks = new Map<string, Set<Function>>();

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
const onRegisterCallEvent = (name: string, args: any[]) => {
	for (const callback of callbacks.get(name) ?? []) {
		try {
			callback(...args);
		} catch (err) {
			warn("[AMLL] 处理原生回调时发生错误", err);
		}
	}
};

export const appendRegisterCall = (
	name: string,
	namespace: string,
	callback: Function,
) =>
	isNCMV3()
		? appendRegisterCallRaw(`${namespace}.on${name}`, callback)
		: legacyNativeCmder.appendRegisterCall(name, namespace, callback);

export const appendRegisterCallRaw = (name: string, callback: Function) => {
	if (isNCMV3()) {
		if (!registeredEvt.has(name)) {
			registeredEvt.add(name);
			channel.registerCall(name, (...args) => {
				onRegisterCallEvent(name, args);
			});
		}
		if (!callbacks.has(name)) callbacks.set(name, new Set());
		callbacks.get(name)?.add(callback);
	} else {
		throw new TypeError("该功能在 3.0.0 之前不支持");
	}
};

export const removeRegisterCall = (
	name: string,
	namespace: string,
	callback: Function,
) =>
	isNCMV3()
		? removeRegisterCallRaw(`${namespace}.on${name}`, callback)
		: legacyNativeCmder.removeRegisterCall(name, namespace, callback);

export const removeRegisterCallRaw = (name: string, callback: Function) => {
	if (isNCMV3()) {
		if (callbacks.has(name)) {
			callbacks.get(name)?.delete(callback);
			if (callbacks.get(name)?.size === 0) callbacks.delete(name);
		}
	} else {
		throw new TypeError("该功能在 3.0.0 之前不支持");
	}
};

// export const emitRegisteredCallbacks = (cmd: string, ...args: any[]) => {
// 	if (isNCMV3()) {
// 		const cbs = channel.registerCallbacks.get(cmd);
// 		if (cbs) {
// 			for (const cb of cbs) {
// 				try {
// 					cb(...args);
// 				} catch (err) {
// 					warn(err);
// 				}
// 			}
// 		}
// 	}
// };

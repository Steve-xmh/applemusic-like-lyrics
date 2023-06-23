import { log } from "./utils/logger";

const hookCall = channel.call;
// const hookRegisterCall = channel.registerCall;

channel.call = function AppleMusicLikeLyricCallHook(
	cmd: string,
	// rome-ignore lint/suspicious/noExplicitAny: Hook
	...args: any[]
) {
	if (cmd === "storage.downloadscanner") {
		log(cmd, ...args, new Error().stack);
	} else {
		return hookCall.apply(hookCall, [cmd, ...args]);
	}
};

// channel.registerCall = function AppleMusicLikeLyricRegisterCallHook(
// 	cmd: string,
// 	callback: Function,
// ) {
// 	channel.registerCallbacks ??= new Map();
// 	const hookedCallback = (...args) => {
// 		log("registerCalled", cmd, this, args);
// 		return callback(...args);
// 	};
// 	log("registerCall", cmd, [callback]);
// 	if (!channel.registerCallbacks.has(cmd))
// 		channel.registerCallbacks.set(cmd, new Set());
// 	channel.registerCallbacks.get(cmd)!.add(hookedCallback.bind(this));
// 	return hookRegisterCall.apply(hookRegisterCall, [cmd, hookedCallback]);
// };

import { log } from "./utils/logger";

const hookCall = channel.call;
const hookRegisterCall = channel.registerCall;

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

channel.registerCall = function AppleMusicLikeLyricRegisterCallHook(
	cmd: string,
	callback: Function,
) {
	log(cmd, [callback]);
	return hookRegisterCall.apply(hookRegisterCall, [cmd, callback]);
};

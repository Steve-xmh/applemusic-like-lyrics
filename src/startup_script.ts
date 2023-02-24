import { log } from "./utils/logger";

const hookCall = channel.call;

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

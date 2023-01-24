/**
 * @fileoverview
 * 和 LibFrontendPlay 插件的扩展支持库
 */

import { GLOBAL_EVENTS } from "../utils/global-events";
import { log, warn } from "../utils/logger";

export function checkLibFrontendPlaySupport() {
	const lfpPlugin = loadedPlugins.LibFrontendPlay;
	if (lfpPlugin) {
		try {
			// 借用其可视化效果
			lfpPlugin.addEventListener(
				"updateCurrentAudioPlayer",
				(evt: CustomEvent<HTMLAudioElement>) => {
					GLOBAL_EVENTS.dispatchEvent(new CustomEvent("lfp-audio-updated"));
				},
			);
			log("已和 LibFrontendPlay 扩展对接！");
		} catch (err) {
			warn("与 LibFrontendPlay 插件扩展支持失败", err);
		}
	}
}

/**
 * @fileoverview
 * 和 LibFrontendPlay 插件的扩展支持库
 */

import { GLOBAL_EVENTS } from "./global-events";
import { warn } from "./logger";

export let lfpPluginSupported = false;
export let lfpPluginEnabled = false;

export function checkLibFrontendPlaySupport() {
	const lfpPlugin = loadedPlugins.LibFrontendPlay;
	if (lfpPlugin) {
		lfpPluginEnabled = lfpPlugin.enabled;
		try {
			// 借用其可视化效果
			lfpPlugin.addEventListener(
				"updateCurrentAudioPlayer",
				(evt: CustomEvent<HTMLAudioElement>) => {
					GLOBAL_EVENTS.dispatchEvent(new CustomEvent("lfp-audio-updated"));
				},
			);
			lfpPlugin.addEventListener(
				"pluginEnabled",
				(evt: CustomEvent<HTMLAudioElement>) => {
					lfpPluginEnabled = true;
					GLOBAL_EVENTS.dispatchEvent(new CustomEvent("lfp-enabled"));
				},
			);
			lfpPlugin.addEventListener(
				"pluginDisabled",
				(evt: CustomEvent<HTMLAudioElement>) => {
					lfpPluginEnabled = false;
					GLOBAL_EVENTS.dispatchEvent(new CustomEvent("lfp-disabled"));
				},
			);
			lfpPluginSupported = true;
			GLOBAL_EVENTS.dispatchEvent(new CustomEvent("lfp-supported"));
		} catch (err) {
			warn("与 LibFrontendPlay 插件扩展支持失败", err);
		}
	}
}

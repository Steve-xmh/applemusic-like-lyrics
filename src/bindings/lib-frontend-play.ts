/**
 * @fileoverview
 * 和 LibFrontendPlay 插件的扩展支持库
 */

import { GLOBAL_EVENTS } from "../utils/global-events";
import { warn } from "../utils/logger";
import { atom, useSetAtom } from "jotai";

export const lfpPluginSupported = atom(false);
export const lfpPluginEnabled = atom(false);

export function checkLibFrontendPlaySupport() {
	const lfpPlugin = loadedPlugins.LibFrontendPlay;
	const setLfpPluginSupported = useSetAtom(lfpPluginSupported);
	const setLfpPluginEnabled = useSetAtom(lfpPluginEnabled);
	if (lfpPlugin) {
		setLfpPluginEnabled(lfpPlugin.enabled);
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
					setLfpPluginSupported(true);
				},
			);
			lfpPlugin.addEventListener(
				"pluginDisabled",
				(evt: CustomEvent<HTMLAudioElement>) => {
					setLfpPluginSupported(false);
				},
			);
			setLfpPluginSupported(true);
		} catch (err) {
			warn("与 LibFrontendPlay 插件扩展支持失败", err);
		}
	}
}

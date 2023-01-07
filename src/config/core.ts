/**
 * @fileoverview
 * 自己写的一个配置存储方案，BetterNCM 提供的保存方式性能损耗有点大
 * 配置会先读取然后缓存，写入的时候会做防抖后再写入
 */

import { GLOBAL_EVENTS } from "../global-events";
import { debounce } from "../utils";

export interface Config {
	[key: string]: string | undefined;
}

export let GLOBAL_CONFIG: Config = loadConfig();

export function loadConfig(): Config {
	try {
		return JSON.parse(
			localStorage.getItem(`config.betterncm.${plugin.manifest.slug}`) || "{}",
		);
	} catch {
		return {};
	}
}

export function getFullConfig(): { [key: string]: string | undefined } {
	try {
		return JSON.parse(
			localStorage.getItem(`config.betterncm.${plugin.manifest.slug}`) || "{}",
		);
	} catch {
		return {};
	}
}

export const saveConfig = debounce(function saveConfig() {
	localStorage.setItem(
		`config.betterncm.${plugin.manifest.slug || plugin.manifest.name}`,
		JSON.stringify(GLOBAL_CONFIG),
	);
	GLOBAL_EVENTS.dispatchEvent(new Event("config-saved"));
}, 2000);

export function setConfig(key: string, value?: string) {
	if (value === undefined) {
		// rome-ignore lint/performance/noDelete: 防止 JSON 还把其写入配置中
		delete GLOBAL_CONFIG[key];
	} else {
		GLOBAL_CONFIG[key] = value;
	}
	saveConfig();
}

export function getConfig(key: string, defaultValue: string): string;
export function getConfig(
	key: string,
	defaultValue?: string,
): string | undefined;
export function getConfig(key: string, defaultValue?: string) {
	if (GLOBAL_CONFIG[key] === undefined) {
		return defaultValue;
	} else {
		return GLOBAL_CONFIG[key];
	}
}

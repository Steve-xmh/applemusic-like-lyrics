/**
 * @fileoverview
 * 自己写的一个配置存储方案，BetterNCM 提供的保存方式性能损耗有点大
 * 配置会先读取然后缓存，写入的时候会做防抖后再写入
 */

import { GLOBAL_EVENTS } from "../global-events";
import { warn } from "../logger";
import { debounce } from "../utils";
import { slug } from "../../manifest.json";

export interface Config {
	[key: string]: string | undefined;
}

const PLUGIN_CONFIG_KEY = `config.betterncm.${
	"plugin" in globalThis
		? plugin?.manifest?.slug || plugin?.manifest?.name || slug
		: slug
}`;
export let GLOBAL_CONFIG: Config = loadConfig();

export function loadConfig(): Config {
	try {
		return JSON.parse(localStorage.getItem(PLUGIN_CONFIG_KEY) || "{}");
	} catch (err) {
		warn("警告：AMLL 插件配置读取失败", err);
		return {};
	}
}

export function getFullConfig(): { [key: string]: string | undefined } {
	return GLOBAL_CONFIG || {};
}

export const saveConfig = debounce(function saveConfig() {
	try {
		localStorage.setItem(PLUGIN_CONFIG_KEY, JSON.stringify(GLOBAL_CONFIG));
	} catch (err) {
		warn("警告：AMLL 插件配置保存失败", err);
	}
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

/**
 * @fileoverview
 * 自己写的一个配置存储方案，BetterNCM 提供的保存方式性能损耗有点大
 * 配置会先读取然后缓存，写入的时候会做防抖后再写入
 */

import { GLOBAL_EVENTS } from "../utils/global-events";
import { log, warn } from "../utils/logger";
import { setConfigFromMain } from "../worker";
import { IS_WORKER } from "../utils/is-worker";
import { normalizePath } from "../utils/path";
import { debounce } from "../utils/debounce";

export interface Config {
	[key: string]: string | undefined;
}

export let GLOBAL_CONFIG: Config = {};

const getConfigPath = () =>
	normalizePath(`${plugin.mainPlugin.pluginPath}/../../amll-data`);

const getConfigFilePath = () =>
	normalizePath(`${getConfigPath()}/amll-settings.json`);

export async function loadConfig(): Promise<Config> {
	if (IS_WORKER) {
		return {};
	}
	try {
		return JSON.parse(
			await (await betterncm.fs.readFile(getConfigFilePath())).text(),
		);
	} catch (err) {
		warn("警告：AMLL 插件配置读取失败", err);
	}
	return {};
}

export async function initConfig() {
	GLOBAL_CONFIG = await loadConfig();
	log("AMLL 插件配置初始化完毕");
}

export function getFullConfig(): {
	[key: string]: string | undefined;
} {
	return GLOBAL_CONFIG || {};
}

if (!IS_WORKER) {
	window.addEventListener("unload", forceSaveConfig);
}

export async function forceSaveConfig() {
	if (IS_WORKER) {
		GLOBAL_EVENTS.dispatchEvent(new Event("config-saved"));
		return;
	}
	try {
		if (!(await betterncm.fs.exists(getConfigPath()))) {
			await betterncm.fs.mkdir(getConfigPath());
		}
		await betterncm.fs.writeFile(
			getConfigFilePath(),
			JSON.stringify(GLOBAL_CONFIG),
		);
		log("AMLL 插件配置保存成功");
	} catch (err) {
		warn("警告：AMLL 插件配置保存失败", err);
	}
	GLOBAL_EVENTS.dispatchEvent(new Event("config-saved"));
}

export const saveConfig = debounce(forceSaveConfig, 500);

export function setConfig(key: string, value?: string) {
	if (!IS_WORKER) setConfigFromMain({ [key]: value });
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

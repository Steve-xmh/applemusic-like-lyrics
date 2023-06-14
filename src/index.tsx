/// <reference types="./types/global" />
import "./config";
import { createRoot, Root } from "react-dom/client";
import { LyricView } from "./components/lyric-player";
import { GLOBAL_EVENTS } from "./utils/global-events";
import { clearCache } from "canvas-hypertxt";
import * as React from "react";
import { MantineProvider, createStyles, Title } from "@mantine/core";
import { getConfig, getFullConfig, initConfig } from "./config/core";
import { currentWorkerScript, restartWorker } from "./worker";
import semverLt from "semver/functions/lt";

export let cssContent = "";

const camelToSnakeCase = (str: string) =>
	str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

function buildStylesheetFromConfig() {
	const variableTable: Map<string, string> = new Map();
	const result: string[] = [];
	// mainViewElement.setAttribute("class", "");
	// fmViewElement.setAttribute("class", "amll-fm-view");
	// 收集自己的变量
	// 构造成全局变量选择器
	result.push(":root {\n");
	const fullConfig = getFullConfig();
	for (const key in fullConfig) {
		const snakeKey = camelToSnakeCase(key);
		const value = fullConfig[key] || "";
		if (value === "true") {
			// mainViewElement.classList.add(snakeKey);
			// fmViewElement.classList.add(snakeKey);
		} else {
			// mainViewElement.classList.remove(snakeKey);
			// fmViewElement.classList.remove(snakeKey);
		}
		variableTable.set(key, value);
		variableTable.set(snakeKey, value);
		const varkey = `--applemusic-like-lyrics-${snakeKey}`;
		if (String(Number(value)) === value) {
			document.body.style.setProperty(varkey, `${value}px`);
		} else if (!value.includes("\n")) {
			document.body.style.setProperty(varkey, value);
		} else {
			("true");
		}
		result.push(";\n");
	}
	result.push("}\n");
	return result.join("");
}

function buildVariableStylesheet() {
	return buildStylesheetFromConfig() + "\n" + getConfig("customCssContent", "");
}

export function reloadStylesheet(content: string) {
	let varContent = buildVariableStylesheet();
	const existingVarStyle = document.getElementById(
		"apple-music-like-lyrics-var-style",
	);
	if (existingVarStyle) {
		if (existingVarStyle.innerHTML !== varContent) {
			existingVarStyle.innerHTML = varContent;
		}
	} else {
		let style = document.createElement("style") as HTMLStyleElement;
		style.id = "apple-music-like-lyrics-var-style";
		style.innerHTML = varContent;
		document.head.appendChild(style);
	}

	const existingStyle = document.getElementById(
		"apple-music-like-lyrics-style",
	);
	if (existingStyle) {
		if (existingStyle.innerHTML !== content) {
			existingStyle.innerHTML = content;
		}
	} else {
		let style = document.createElement("style") as HTMLStyleElement;
		style.id = "apple-music-like-lyrics-style";
		style.innerHTML = content;
		document.head.appendChild(style);
	}
}

plugin.onLoad(async () => {
	// 加载配置
	await initConfig();

	const isv3 = !semverLt(
		APP_CONF.appver.split(".").slice(0, 3).join("."),
		"3.0.0",
	);

	if (isv3) {
		initInjectorV3();
	} else {
		initInjectorV2();
	}

	GLOBAL_EVENTS.addEventListener("config-saved", () =>
		reloadStylesheet(cssContent),
	);
	(async () => {
		const workerScript = await betterncm.fs.readFileText(
			`${plugin.pluginPath}/worker_script.js`,
		);
		restartWorker(workerScript);
	})();
	if (DEBUG) {
		(async () => {
			const debounceReload = betterncm.utils.debounce(
				() =>
					isv3
						? location.reload()
						: (betterncm_native?.app?.restart ?? betterncm.reload)(),
				1000,
			);

			const debounceRefreshStyle = async function () {
				const curStyle = await betterncm.fs.readFileText(
					`${plugin.pluginPath}/index.css`,
				);
				if (cssContent !== curStyle) {
					cssContent = curStyle;
					reloadStylesheet(cssContent);
				}
			};

			const debounceRefreshWorker = async function () {
				const workerScript = await betterncm.fs.readFileText(
					`${plugin.pluginPath}/worker_script.js`,
				);
				if (currentWorkerScript !== workerScript) {
					restartWorker(workerScript);
				}
			};

			const shouldReloadPaths = [
				"/manifest.json",
				"/index.js",
				"/startup_script.js",
			];

			const currentOriginalFiles = {};

			for (const file of shouldReloadPaths) {
				currentOriginalFiles[file] = betterncm.fs.readFileText(
					plugin.pluginPath + file,
				);
			}

			const normalizedPluginPath = Utils.normalizePath(plugin.pluginPath);
			for (const file of await betterncm.fs.readDir(plugin.pluginPath)) {
				const relPath = Utils.normalizePath(file).replace(
					normalizedPluginPath,
					"",
				);
				currentOriginalFiles[relPath] = betterncm.fs.readFileText(file);
			}

			async function checkFileOrReload(relPath: string) {
				const fileData = await betterncm.fs.readFileText(
					plugin.pluginPath + relPath,
				);
				if (currentOriginalFiles[relPath] !== fileData) {
					currentOriginalFiles[relPath] = fileData;
					if (relPath === "/index.css") {
						warn("检测到", relPath, "更新，正在热重载样式表");
						debounceRefreshStyle();
					} else if (relPath === "/worker_script.js") {
						warn("检测到", relPath, "更新，正在热重载工作线程");
						debounceRefreshWorker();
					} else if (shouldReloadPaths.includes(relPath)) {
						warn(
							"检测到",
							relPath,
							"更新 (",
							currentOriginalFiles[relPath]?.length,
							"->",
							fileData.length,
							")正在重载",
						);
						debounceReload();
					}
				}
			}

			const checkFileOrReloadFunc = {};

			betterncm_native?.fs?.watchDirectory(
				plugin.pluginPath,
				(dirPath, filename) => {
					const normalizedDirPath = Utils.normalizePath(dirPath);
					const fullPath = Utils.normalizePath(`${dirPath}/${filename}`);
					const relPath = fullPath.replace(normalizedDirPath, "");
					checkFileOrReloadFunc[relPath] ||= betterncm.utils.debounce(
						() => checkFileOrReload(relPath),
						1000,
					);
					checkFileOrReloadFunc[relPath]();
				},
			);
		})();
	}
	betterncm.fs
		.readFileText(`${plugin.pluginPath}/index.css`)
		.then((curStyle) => {
			if (cssContent !== curStyle) {
				cssContent = curStyle;
				reloadStylesheet(cssContent);
			}
		});
	log("AMLL 初始化完成！");
});

plugin.onAllPluginsLoaded(() => {
	checkLibFrontendPlaySupport();
});

window.addEventListener(
	"DOMContentLoaded",
	() => {
		reloadStylesheet(cssContent);
		async function clearCacheOnLoad() {
			if (document?.fonts?.ready === undefined) return;
			await document.fonts.ready;
			clearCache();
		}

		void clearCacheOnLoad();
	},
	{
		once: true,
	},
);

window.addEventListener(
	"load",
	() => {
		// 把所有被 Corona 遥测过的函数还原
		for (const key in window) {
			if (typeof window[key] === "function") {
				if ("__corona__" in window[key] && "__orig__" in window[key]) {
					// rome-ignore lint/suspicious/noExplicitAny: <explanation>
					window[key] = (window[key] as any).__orig__;
					log("已还原被遥测函数", `window.${key}`);
				}
			}
		}
	},
	{
		once: true,
	},
);

if (OPEN_PAGE_DIRECTLY) {
	window.addEventListener(
		"load",
		() => {
			const btn = document.querySelector<HTMLAnchorElement>(
				"a[data-action='max']",
			);
			btn?.click();
		},
		{
			once: true,
		},
	);
}

reloadStylesheet(cssContent);

export const useStyles = createStyles;

export const ThemeProvider: React.FC<React.PropsWithChildren> = (props) => {
	return (
		<MantineProvider
			theme={{
				colorScheme: "dark",
			}}
		>
			{props.children}
		</MantineProvider>
	);
};

import * as APIs from "./api";
import * as Utils from "./utils";
import * as WorkerAPIs from "./worker";
import { log, warn } from "./utils/logger";
import { checkLibFrontendPlaySupport } from "./bindings/lib-frontend-play";
import { Provider } from "jotai";
import { NCMEnvWrapper } from "./components/netease-api-wrapper";
import { initInjectorV2, initInjectorV3 } from "./utils/page-injector";
if (DEBUG) {
	for (const key in APIs) {
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		(window as any)[key] = APIs[key];
	}
	for (const key in Utils) {
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		(window as any)[key] = APIs[key];
	}
	for (const key in WorkerAPIs) {
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		(window as any)[key] = WorkerAPIs[key];
	}
}

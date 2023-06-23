/// <reference types="./types/global" />
import "./config";
import { GLOBAL_EVENTS } from "./utils/global-events";
import { clearCache } from "canvas-hypertxt";
import * as React from "react";
import { MantineProvider, createStyles } from "@mantine/core";
import { getConfig, initConfig } from "./config/core";
import { currentWorkerScript, restartWorker } from "./worker";
import { log, warn } from "./utils/logger";
import { checkLibFrontendPlaySupport } from "./bindings/lib-frontend-play";
import {
	buildStylesheetFromConfigV2,
	buildStylesheetFromConfigV3,
	initInjectorV2,
	initInjectorV3,
} from "./utils/page-injector";
import { isNCMV3, normalizePath } from "./utils";

export let cssContent = "";

function buildVariableStylesheet() {
	return (
		(isNCMV3()
			? buildStylesheetFromConfigV3()
			: buildStylesheetFromConfigV2()) +
		"\n" +
		getConfig("customCssContent", "")
	);
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
	try {
		// 加载配置
		await initConfig();

		while (!window?.APP_CONF?.appver)
			await new Promise((resolve) => setTimeout(resolve, 100));

		if (isNCMV3()) {
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
						isNCMV3()
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

				const normalizedPluginPath = normalizePath(plugin.pluginPath);
				for (const file of await betterncm.fs.readDir(plugin.pluginPath)) {
					const relPath = normalizePath(file).replace(normalizedPluginPath, "");
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
						const normalizedDirPath = normalizePath(dirPath);
						const fullPath = normalizePath(`${dirPath}/${filename}`);
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
	} catch (err) {
		debugger;
		throw err;
	}
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

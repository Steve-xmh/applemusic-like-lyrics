import style from "./index.sass?inline";
import { injectLyricPage as injectLyricPageV2 } from "./injector/v2";
import { isNCMV3 } from "./utils/is-ncm-v3";
import { log, warn } from "./utils/logger";
import { normalizePath } from "./utils/path";
import { version } from "../public/manifest.json";
import { configViewElement, initLyricPage } from "./injector";
import { MusicStatusGetterV2 } from "./info/v2";

// 注入样式
function initStyle() {
	const el = document.createElement("style");
	el.setAttribute("type", "text/css");
	el.innerHTML = style;
	document.head.appendChild(el);
}

// 开发重启
async function initDevelopmentReload() {
	const debounceReload = betterncm.utils.debounce(
		() =>
			(betterncm_native?.app?.restart ?? betterncm.reload ?? location.reload)(),
		1000,
	);

	const shouldReloadPaths = ["/manifest.json", "/amll-bncm.iife.js"];

	const currentOriginalFiles = new Map<string, string>();

	for (const file of shouldReloadPaths) {
		currentOriginalFiles.set(
			file,
			await betterncm.fs.readFileText(plugin.pluginPath + file),
		);
	}

	const normalizedPluginPath = normalizePath(plugin.pluginPath);
	for (const file of await betterncm.fs.readDir(plugin.pluginPath)) {
		const relPath = normalizePath(file).replace(normalizedPluginPath, "");
		currentOriginalFiles.set(relPath, await betterncm.fs.readFileText(file));
	}

	async function checkFileOrReload(relPath: string) {
		const fileData = await betterncm.fs.readFileText(
			plugin.pluginPath + relPath,
		);
		if (currentOriginalFiles.get(relPath) !== fileData) {
			currentOriginalFiles.set(relPath, fileData);
			if (shouldReloadPaths.includes(relPath)) {
				warn(
					"检测到",
					relPath,
					"更新 (",
					currentOriginalFiles.get(relPath)?.length,
					"->",
					fileData.length,
					")正在重载",
				);
				debounceReload();
			}
		}
	}

	const checkFileOrReloadFunc = new Map<string, Function>();

	betterncm_native?.fs?.watchDirectory(
		plugin.pluginPath,
		(dirPath, filename) => {
			const normalizedDirPath = normalizePath(dirPath);
			const fullPath = normalizePath(`${dirPath}/${filename}`);
			const relPath = fullPath.replace(normalizedDirPath, "");
			if (!checkFileOrReloadFunc.has(relPath))
				checkFileOrReloadFunc.set(
					relPath,
					betterncm.utils.debounce(() => checkFileOrReload(relPath), 1000),
				);
			const func = checkFileOrReloadFunc.get(relPath);
			if (func) {
				func();
			} else {
				const newFunc = betterncm.utils.debounce(
					() => checkFileOrReload(relPath),
					1000,
				);
				checkFileOrReloadFunc.set(relPath, newFunc);
				newFunc();
			}
		},
	);

	log("已启用开发重载功能！");
}

// 配置页面
plugin.onConfig(() => {
	return configViewElement;
});

// 加载插件
plugin.onLoad(async () => {
	try {
		initStyle();
		console.log(
			`%cApple Music-like Lyrics %c${version}%c for %cBetterNCM`,
			"color:#2AF;font-weight:bold;",
			"color:#2AF;font-weight:normal;",
			"color:unset;font-weight:normal;",
			"color:#F8878A;font-weight:bold;",
		);

		if (import.meta.env.AMLL_DEV) {
			warn("正在以开发模式运行插件！");
			initDevelopmentReload();
		}

		if (isNCMV3()) {
			// TODO: 3.0 的注入支持
		} else {
			plugin.musicStatus = new MusicStatusGetterV2();
			await injectLyricPageV2();
		}

		initLyricPage();

		log("插件初始化完成！");
	} catch (err) {
		warn(err);
	}
});

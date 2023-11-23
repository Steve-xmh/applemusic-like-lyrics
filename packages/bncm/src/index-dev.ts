import "./index.sass";
import { injectLyricPage as injectLyricPageV2 } from "./injector/v2";
import { isNCMV3 } from "./utils/is-ncm-v3";
import { log, warn } from "./utils/logger";
import { normalizePath } from "./utils/path";
import manifest from "virtual:bncm-plugin-manifest";
import { configViewElement, initLyricPage } from "./injector";
import { MusicContextV2 } from "./music-context/v2";
import { openLyricPage } from "./injector";
import { injectLyricPage } from "./injector/dev";

(window as any).APP_CONF = {
	domain: `${location.origin}/ncmapi`,
};

try {
	console.log(
		`%cApple Music-like Lyrics %c${manifest.version}%c for %cBetterNCM %c(Dev Mode)`,
		"color:#2AF;font-weight:bold;",
		"color:#2AF;font-weight:normal;",
		"color:unset;font-weight:normal;",
		"color:#F8878A;font-weight:bold;",
		"color:unset;font-weight:normal;",
	);

	initLyricPage();
	document.body.appendChild(configViewElement);
	openLyricPage();

	log("插件初始化完成！");
} catch (err) {
	warn(err);
}

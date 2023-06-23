import { Root, createRoot } from "react-dom/client";
import { log } from "../logger";
import { Provider } from "jotai";
import { ErrorBoundary } from "../../components/error-boundary";
import { NCMEnvWrapper } from "../../components/netease-api-wrapper";
import { LyricView } from "../../components/lyric-player";
import { ThemeProvider } from "../..";
import { GLOBAL_EVENTS } from "../global-events";
import { getFullConfig } from "../../config/core";

export let mainViewElement: HTMLDivElement = document.createElement("div");
mainViewElement.id = "applemusic-like-lyrics-view";
mainViewElement.classList.add("ncm-v3");
let mainViewRoot: Root;

const camelToSnakeCase = (str: string) =>
	str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

export function buildStylesheetFromConfig() {
	const variableTable: Map<string, string> = new Map();
	const result: string[] = [];
	mainViewElement.setAttribute("class", "ncm-v3");
	// 收集自己的变量
	// 构造成全局变量选择器
	result.push(":root {\n");
	const fullConfig = getFullConfig();
	for (const key in fullConfig) {
		const snakeKey = camelToSnakeCase(key);
		const value = fullConfig[key] || "";
		if (value === "true") {
			mainViewElement.classList.add(snakeKey);
		} else {
			mainViewElement.classList.remove(snakeKey);
		}
		variableTable.set(key, value);
		variableTable.set(snakeKey, value);
		const varkey = `--applemusic-like-lyrics-${snakeKey}`;
		if (String(Number(value)) === value) {
			document.body.style.setProperty(varkey, `${value}px`);
		} else if (typeof value === "string" && !value.includes("\n")) {
			document.body.style.setProperty(varkey, value);
		} else {
			("true");
		}
		result.push(";\n");
	}
	result.push("}\n");
	return result.join("");
}

export let songInfoPayload: any = {};
export let appStore: any = {};
export async function initInjector() {
	await betterncm.utils.waitForElement("#page_pc_mini_bar .miniVinylWrapper");
	const footerRightButtons = await betterncm.utils.waitForElement(
		"footer .right",
	);
	const amllViewButton = document.createElement("button");
	amllViewButton.id = "amll-view-button";
	amllViewButton.classList.add("amll-view-button");
	amllViewButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><path d="M14.4 12.2c0-1.1.8-1.9 2-1.9 1.3 0 2.1 1 2.1 2.4 0 2-1.7 3.2-2.7 3.2-.3 0-.5-.2-.5-.4s.1-.4.4-.4c.8-.2 1.4-.7 1.7-1.4h-.2c-.2.3-.6.4-1.1.4-1-.1-1.7-.9-1.7-1.9zm-4.9 0c0-1.1.8-1.9 2-1.9 1.3 0 2.1 1 2.1 2.4 0 2-1.7 3.2-2.7 3.2-.3 0-.5-.2-.5-.4s.1-.4.4-.4c.8-.2 1.5-.7 1.7-1.4h-.2c-.2.3-.6.4-1.1.4-1-.1-1.7-.9-1.7-1.9zm.9 9.2l2.8-2.7c.6-.6.9-.7 1.6-.7h4.6c1.3 0 2.1-.8 2.1-2.1V9.4c0-1.4-.8-2.1-2.1-2.1H8.5c-1.3 0-2.1.7-2.1 2.1v6.5c0 1.3.8 2.1 2.1 2.1h1c.6 0 .9.3.9.9v2.5zM9.9 24c-.9 0-1.5-.6-1.5-1.6v-2h-.5C5.4 20.3 4 19 4 16.5V9c0-2.5 1.5-4 4.1-4h11.8C22.5 5 24 6.4 24 9v7.6c0 2.5-1.5 3.8-4.1 3.8h-5.1l-3.1 2.7c-.7.6-1.2.9-1.8.9z"/></svg>`;
	footerRightButtons?.prepend(amllViewButton);

	window.amllDispatchHook = function amllDispatchHook(payload) {
		if (
			payload?.type === "setPlaying" ||
			payload?.type === "playing/setPlaying"
		) {
			songInfoPayload = payload?.payload ?? {};
		} else {
			log("amllDispatchHook", payload?.type, payload?.payload);
		}
		appStore = {
			...appStore,
			...(payload?.payload ?? {}),
		};
		// log(appStore)
	};

	mainViewRoot = createRoot(mainViewElement);
	mainViewRoot.render(
		<Provider>
			<ErrorBoundary>
				<ThemeProvider>
					<NCMEnvWrapper />
					<LyricView />
				</ThemeProvider>
			</ErrorBoundary>
		</Provider>,
	);
	document.body.appendChild(mainViewElement);

	amllViewButton.addEventListener("click", () => {
		GLOBAL_EVENTS.dispatchEvent(new Event("lyric-page-open", undefined));
	});

	GLOBAL_EVENTS.addEventListener("lyric-page-open", () => {
		document.body.classList.add("amll-lyric-page-open");
	});

	GLOBAL_EVENTS.addEventListener("lyric-page-hide", () => {
		document.body.classList.remove("amll-lyric-page-open");
	});
}

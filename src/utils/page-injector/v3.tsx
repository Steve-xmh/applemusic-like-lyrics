import { Root, createRoot } from "react-dom/client";
import { log } from "../logger";
import { Provider } from "jotai";
import { ErrorBoundary } from "../../components/error-boundary";
import { NCMEnvWrapper } from "../../components/netease-api-wrapper";
import { LyricView } from "../../components/lyric-player";
import { ThemeProvider } from "../..";
import { GLOBAL_EVENTS } from "../global-events";

export let mainViewElement: HTMLDivElement = document.createElement("div");
mainViewElement.id = "applemusic-like-lyrics-view";
mainViewElement.classList.add("ncm-v3");
let mainViewRoot: Root;

export async function initInjector() {
	const pagePCMiniBar = await betterncm.utils.waitForElement(
		"#page_pc_mini_bar .miniVinylWrapper",
	);
	if (pagePCMiniBar) {
		pagePCMiniBar.addEventListener("click", (evt: MouseEvent) => {
			evt.stopPropagation();
			evt.stopImmediatePropagation();
			evt.preventDefault();
			if (!mainViewRoot) {
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
			}
			GLOBAL_EVENTS.dispatchEvent(new Event("lyric-page-open", undefined));
		});
	}

	GLOBAL_EVENTS.addEventListener("lyric-page-open", () => {
		document.body.classList.add("amll-lyric-page-open");
	});

	GLOBAL_EVENTS.addEventListener("lyric-page-hide", () => {
		document.body.classList.remove("amll-lyric-page-open");
	});
}

import { Root, createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { Provider } from "jotai";
import { LyricPlayer } from "../player";
import { MusicInfoWrapper } from "../music-context/wrapper";
import { LyricProvider } from "../lyric/provider";
import { WebSocketWrapper } from "../music-context/ws-wrapper";
import { AMLLConfig } from "../components/config";
import { AMLLGuide } from "../player/guide";
import { Suspense } from "react";

export const mainViewElement: HTMLDivElement = document.createElement("div");
mainViewElement.id = "amll-view";
export const configViewElement: HTMLDivElement = document.createElement("div");
configViewElement.id = "amll-config-view";
configViewElement.style.height = "100%";
let appRoot: Root;

export function initLyricPage() {
	appRoot = createRoot(mainViewElement);
	appRoot.render(
		<Provider>
			<Suspense>
				<AMLLGuide />
				<MusicInfoWrapper />
				<WebSocketWrapper />
				<LyricProvider />
				{createPortal(<LyricPlayer />, mainViewElement)}
				{createPortal(<AMLLConfig />, configViewElement)}
			</Suspense>
		</Provider>,
	);
	document.body.appendChild(mainViewElement);
}

export function openLyricPage() {
	document.body.classList.add("amll-lyric-page-open");
	window.dispatchEvent(new Event("amll-lyric-page-opened"));
}

export function closeLyricPage() {
	document.body.classList.remove("amll-lyric-page-open");
	window.dispatchEvent(new Event("amll-lyric-page-closed"));
}

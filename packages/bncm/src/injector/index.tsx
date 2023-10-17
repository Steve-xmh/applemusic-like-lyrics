import { Root, createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { Provider, atom, createStore } from "jotai";
import { LyricPlayer } from "../player";
import { MusicInfoWrapper } from "../music-context/wrapper";
import { LyricProvider } from "../lyric/provider";
import { WebSocketWrapper } from "../music-context/ws-wrapper";
import { AMLLConfig } from "../components/config";
import { AMLLGuide } from "../player/common/guide";
import { Suspense } from "react";

export const mainViewElement: HTMLDivElement = document.createElement("div");
mainViewElement.id = "amll-view";
export const configViewElement: HTMLDivElement = document.createElement("div");
configViewElement.id = "amll-config-view";
configViewElement.style.height = "100%";
let appRoot: Root;

export const globalStore = createStore();
export enum AMLLEnvironment {
	BetterNCM = "betterncm",
	AMLLPlayer = "amllplayer",
}
export const amllEnvironmentAtom = atom(AMLLEnvironment.BetterNCM);

export function initLyricPage() {
	appRoot = createRoot(mainViewElement);
	appRoot.render(
		<Provider store={globalStore}>
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

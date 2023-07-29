import { Root, createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { Provider } from "jotai";
import { LyricPlayer } from "../player";
import { MusicInfoWrapper } from "../info/wrapper";

export const mainViewElement: HTMLDivElement = document.createElement("div");
mainViewElement.id = "amll-view";
export const configViewElement: HTMLDivElement = document.createElement("div");
configViewElement.id = "amll-config-view";
let appRoot: Root;
export function initLyricPage() {
	appRoot = createRoot(mainViewElement);
	appRoot.render(
		<Provider>
			<MusicInfoWrapper />
			{createPortal(<LyricPlayer />, mainViewElement)}
			{createPortal(<div>Config</div>, configViewElement)}
		</Provider>,
	);
	document.body.appendChild(mainViewElement);
}

export function openLyricPage() {
	document.body.classList.add("amll-lyric-page-open");
}

export function closeLyricPage() {
	document.body.classList.remove("amll-lyric-page-open");
}

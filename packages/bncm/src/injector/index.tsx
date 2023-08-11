import { Root, createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { Provider } from "jotai";
import { LyricPlayer } from "../player";
import { MusicInfoWrapper } from "../music-context/wrapper";
import { LyricProvider } from "../lyric/provider";
import { WebSocketWrapper } from "../music-context/ws-wrapper";
import AMLLIcon from "../assets/amll-icon.svg";
import { Button } from "../components/appkit/button";
import { GroupBox, GroupBoxDevider } from "../components/appkit/group-box";
import { TextField } from "../components/appkit/text-field";
import { Switch } from "../components/appkit/switch/switch";
import { AppKitWindowFrame, SidebarItem } from "../components/appkit/window";
import { AMLLConfig } from "../components/config";

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
			<WebSocketWrapper />
			<LyricProvider />
			{createPortal(<LyricPlayer />, mainViewElement)}
			{createPortal(<AMLLConfig />, configViewElement)}
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

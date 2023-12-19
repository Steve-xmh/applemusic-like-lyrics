import { Root, createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { Provider, atom, createStore } from "jotai";
import { LyricPlayer } from "../player";
import { MusicInfoWrapper } from "../music-context/wrapper";
import { LyricProvider } from "../lyric/provider";
import { WebSocketWrapper } from "../music-context/ws-wrapper";
import { AMLLConfig } from "../components/config";
import { AMLLGuide } from "../player/common/guide";
import { FC, PropsWithChildren, Suspense, useEffect } from "react";
import { warn } from "../utils/logger";
import { AudioFFTContext } from "../player/common/fft-context";

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
	Component = "component",
}
export const amllEnvironmentAtom = atom(AMLLEnvironment.BetterNCM);

const SuspenseLoggerInner: FC<PropsWithChildren<{ text: String }>> = (
	props,
) => {
	useEffect(() => {
		warn("SuspenseLogger 检测到状态等待状态", props.text);
		return () => {
			warn("SuspenseLogger 检测到状态已获取", props.text);
		};
	}, []);
	return <>{props.children}</>;
};

export const SuspenseLogger: FC<PropsWithChildren<{ text: String }>> = (
	props,
) => {
	return (
		<Suspense fallback={<SuspenseLoggerInner text={props.text} />}>
			{props.children}
		</Suspense>
	);
};

export function initLyricPage() {
	appRoot = createRoot(mainViewElement);
	appRoot.render(
		<Provider store={globalStore}>
			<Suspense>
				<AMLLGuide />
				<SuspenseLogger text="MusicInfoWrapper">
					<MusicInfoWrapper />
				</SuspenseLogger>
				<SuspenseLogger text="WebSocketWrapper">
					<WebSocketWrapper />
				</SuspenseLogger>
				<SuspenseLogger text="AudioFFTContext">
					<AudioFFTContext />
				</SuspenseLogger>
				<SuspenseLogger text="LyricProvider">
					<LyricProvider />
				</SuspenseLogger>
				{createPortal(
					<SuspenseLogger text="LyricPlayer">
						<LyricPlayer />
					</SuspenseLogger>,
					mainViewElement,
				)}
				{createPortal(
					<SuspenseLogger text="AMLLConfig">
						<AMLLConfig />
					</SuspenseLogger>,
					configViewElement,
				)}
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

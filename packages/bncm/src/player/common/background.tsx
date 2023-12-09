import { useAtomValue } from "jotai";
import type { FC } from "react";
import {
	backgroundFakeLiquidStaticModeAtom,
	backgroundTypeAtom,
	enableBackgroundAtom,
	backgroundCustomSolidColorAtom,
} from "../../components/config/atoms";
import {
	ConnectionColor,
	wsConnectionStatusAtom,
} from "../../music-context/ws-states";
import { BackgroundRender } from "@applemusic-like-lyrics/react";
import {
	displayMusicCoverAtom,
	lyricPageOpenedAtom,
} from "../../music-context/wrapper";
import "./background.sass";

export const Background: FC = () => {
	const enableBackground = useAtomValue(enableBackgroundAtom);
	const lyricPageOpened = useAtomValue(lyricPageOpenedAtom);
	const musicCoverUrl = useAtomValue(displayMusicCoverAtom);
	const backgroundCustomSolidColor = useAtomValue(
		backgroundCustomSolidColorAtom,
	);
	const wsStatus = useAtomValue(wsConnectionStatusAtom);
	const backgroundFakeLiquidStaticMode = useAtomValue(
		backgroundFakeLiquidStaticModeAtom,
	);
	const backgroundType = useAtomValue(backgroundTypeAtom);
	if (wsStatus.color !== ConnectionColor.Active && enableBackground) {
		if (backgroundType === "fake-liquid") {
			return (
				<BackgroundRender
					className="amll-background-render-wrapper"
					staticMode={backgroundFakeLiquidStaticMode}
					disabled={!lyricPageOpened}
					albumImageUrl={musicCoverUrl}
				/>
			);
		} else if (backgroundType === "custom-solid-color") {
			return (
				<div
					style={{
						gridColumn: "1 / 3",
						gridRow: "1 / 7",
						position: "absolute",
						width: "100%",
						height: "100%",
						pointerEvents: "none",
						background: backgroundCustomSolidColor,
						zIndex: "-1",
					}}
				/>
			);
		}
	}
	return null;
};

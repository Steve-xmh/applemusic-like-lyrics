import { useAtomValue } from "jotai";
import type { FC } from "react";
import {
	backgroundStaticModeAtom,
	backgroundTypeAtom,
	enableBackgroundAtom,
	backgroundCustomSolidColorAtom,
	BackgroundType,
	backgroundMaxFPSAtom,
	backgroundRenderScaleAtom,
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
import { EplorRenderer } from "@applemusic-like-lyrics/core";

export const Background: FC = () => {
	const enableBackground = useAtomValue(enableBackgroundAtom);
	const lyricPageOpened = useAtomValue(lyricPageOpenedAtom);
	const musicCoverUrl = useAtomValue(displayMusicCoverAtom);
	const backgroundMaxFPS = useAtomValue(backgroundMaxFPSAtom);
	const backgroundRenderScale = useAtomValue(backgroundRenderScaleAtom);
	const backgroundCustomSolidColor = useAtomValue(
		backgroundCustomSolidColorAtom,
	);
	const wsStatus = useAtomValue(wsConnectionStatusAtom);
	const backgroundFakeLiquidStaticMode = useAtomValue(backgroundStaticModeAtom);
	const backgroundType = useAtomValue(backgroundTypeAtom);
	if (wsStatus.color !== ConnectionColor.Active && enableBackground) {
		if (
			backgroundType === BackgroundType.FakeLiquid ||
			backgroundType === BackgroundType.LiquidEplor
		) {
			return (
				<BackgroundRender
					className="amll-background-render-wrapper"
					staticMode={backgroundFakeLiquidStaticMode}
					disabled={!lyricPageOpened}
					albumImageUrl={musicCoverUrl}
					fps={backgroundMaxFPS}
					renderScale={backgroundRenderScale}
					renderer={
						backgroundType === BackgroundType.LiquidEplor
							? EplorRenderer
							: undefined
					}
				/>
			);
		} else if (backgroundType === BackgroundType.CustomSolidColor) {
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

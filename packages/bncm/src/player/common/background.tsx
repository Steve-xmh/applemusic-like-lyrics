import { useAtomValue } from "jotai";
import { useState, type FC, useEffect } from "react";
import {
	backgroundStaticModeAtom,
	backgroundTypeAtom,
	enableBackgroundAtom,
	backgroundCustomSolidColorAtom,
	BackgroundType,
	backgroundMaxFPSAtom,
	backgroundRenderScaleAtom,
	showBackgroundFFTLowFreqAtom,
	backgroundFlowSpeedAtom,
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
import { fftDataAtom } from "./fft-context";
import { globalStore } from "../../injector";

export const Background: FC = () => {
	const enableBackground = useAtomValue(enableBackgroundAtom);
	const lyricPageOpened = useAtomValue(lyricPageOpenedAtom);
	const musicCoverUrl = useAtomValue(displayMusicCoverAtom);
	const backgroundMaxFPS = useAtomValue(backgroundMaxFPSAtom);
	const showBackgroundFFTLowFreq = useAtomValue(showBackgroundFFTLowFreqAtom);
	const backgroundRenderScale = useAtomValue(backgroundRenderScaleAtom);
	const flowSpeed = useAtomValue(backgroundFlowSpeedAtom);
	const backgroundCustomSolidColor = useAtomValue(
		backgroundCustomSolidColorAtom,
	);
	const wsStatus = useAtomValue(wsConnectionStatusAtom);
	const backgroundFakeLiquidStaticMode = useAtomValue(backgroundStaticModeAtom);
	const backgroundType = useAtomValue(backgroundTypeAtom);
	const [lowFreqVolume, setLowFreqVolume] = useState(1);
	const [dbgValue, setDbgValue] = useState<number[]>([]);

	useEffect(() => {
		let curValue = 1;

		let stopped = false;
		let lt = 0;
		const onFrame = (dt: number) => {
			if (stopped) return;
			const delta = dt - lt;
			const fftData = globalStore.get(fftDataAtom);

			if (showBackgroundFFTLowFreq) setDbgValue(fftData.slice(0, 3));

			const value =
				Math.pow(
					Math.max(
						Math.sqrt(fftData[0] + fftData[1] + fftData[2] * 0.5 ?? 1) * 0.001 -
							0.15,
						0.0,
					) *
						4.0 +
						1.0,
					1.2,
				) - 1.0;
			setLowFreqVolume(curValue);

			const increasing = curValue < value;

			if (increasing) {
				curValue = Math.min(
					value,
					curValue + (value - curValue) * 0.003 * delta,
				);
			} else {
				curValue = Math.max(
					value,
					curValue + (value - curValue) * 0.003 * delta,
				);
			}

			if (isNaN(curValue)) curValue = 1;

			requestAnimationFrame(onFrame);
			lt = dt;
		};

		onFrame(0);

		return () => {
			stopped = true;
		};
	}, [
		wsStatus.color,
		enableBackground,
		backgroundType,
		showBackgroundFFTLowFreq,
	]);

	if (wsStatus.color !== ConnectionColor.Active && enableBackground) {
		if (
			backgroundType === BackgroundType.FakeLiquid ||
			backgroundType === BackgroundType.LiquidEplor
		) {
			return (
				<>
					<BackgroundRender
						className="amll-background-render-wrapper"
						staticMode={backgroundFakeLiquidStaticMode}
						disabled={!lyricPageOpened}
						albumImageUrl={musicCoverUrl}
						fps={backgroundMaxFPS}
						lowFreqVolume={lowFreqVolume}
						renderScale={backgroundRenderScale}
						flowSpeed={flowSpeed}
						renderer={
							backgroundType === BackgroundType.LiquidEplor
								? EplorRenderer
								: undefined
						}
					/>
					{showBackgroundFFTLowFreq && (
						<div
							style={{
								position: "fixed",
								textAlign: "right",
								width: "10em",
								fontFamily: "monospace",
							}}
						>
							<div style={{ fontFamily: "monospace" }}>
								{lowFreqVolume.toFixed(4)}
							</div>
							{dbgValue.map((v) => (
								<div style={{ fontFamily: "monospace" }}>{v.toFixed(4)}</div>
							))}
						</div>
					)}
				</>
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

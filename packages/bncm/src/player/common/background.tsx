import { atom, useAtom, useAtomValue } from "jotai";
import { useState, type FC, useEffect, useMemo, useLayoutEffect } from "react";
import {
	backgroundStaticModeAtom,
	backgroundTypeAtom,
	enableBackgroundAtom,
	backgroundCustomSolidColorAtom,
	BackgroundType,
	backgroundMaxFPSAtom,
	backgroundRenderScaleAtom,
	showBackgroundFFTLowFreqAtom,
	forceHasLyricsBackgroundAtom,
	backgroundFlowSpeedAtom,
} from "../../components/config/atoms";
import {
	ConnectionColor,
	wsConnectionStatusAtom,
} from "../../music-context/ws-states";
import { BackgroundRender } from "@applemusic-like-lyrics/react";
import {
	displayMusicCoverAtom,
	loadableMusicOverrideDataAtom,
	lyricPageOpenedAtom,
} from "../../music-context/wrapper";
import "./background.sass";
import {
	BaseRenderer,
	MeshGradientRenderer,
} from "@applemusic-like-lyrics/core";
import { fftDataAtom } from "./fft-context";
import { globalStore } from "../../injector";
import { lyricLinesAtom } from "../../lyric/provider";

import { playStatusAtom } from "../../music-context/wrapper";
import { PlayState } from "../../music-context";

type AnyRenderer = { new (canvas: HTMLCanvasElement): BaseRenderer };

export const forceOverrideBgRendererAtom = atom<{
	renderer: AnyRenderer;
} | null>(null);

export const Background: FC = () => {
	const enableBackground = useAtomValue(enableBackgroundAtom);
	const lyricPageOpened = useAtomValue(lyricPageOpenedAtom);
	const musicCoverUrl = useAtomValue(displayMusicCoverAtom);
	const backgroundMaxFPS = useAtomValue(backgroundMaxFPSAtom);
	const showBackgroundFFTLowFreq = useAtomValue(showBackgroundFFTLowFreqAtom);
	const forceHasLyricsBackground = useAtomValue(forceHasLyricsBackgroundAtom);
	const forceOverrideBgRenderer = useAtomValue(forceOverrideBgRendererAtom);
	const backgroundRenderScale = useAtomValue(backgroundRenderScaleAtom);
	const flowSpeed = useAtomValue(backgroundFlowSpeedAtom);
	const loadableMusicOverrideData = useAtomValue(loadableMusicOverrideDataAtom);
	const backgroundCustomSolidColor = useAtomValue(
		backgroundCustomSolidColorAtom,
	);
	const wsStatus = useAtomValue(wsConnectionStatusAtom);
	const backgroundFakeLiquidStaticMode = useAtomValue(backgroundStaticModeAtom);
	const lyricLines = useAtomValue(lyricLinesAtom);
	const backgroundType = useAtomValue(backgroundTypeAtom);
	const [lowFreqVolume, setLowFreqVolume] = useState(1);
	const [dbgValue, setDbgValue] = useState<number[]>([]);

	const playstate = useAtomValue(playStatusAtom);

	const gradient: number[] = [];

	const targetRenderer = useMemo<AnyRenderer>(() => {
		if (forceOverrideBgRenderer?.renderer)
			return forceOverrideBgRenderer?.renderer;
		switch (backgroundType) {
			case BackgroundType.LiquidEplor:
				return MeshGradientRenderer;
			case BackgroundType.FakeLiquid:
				return MeshGradientRenderer;
			default:
				return MeshGradientRenderer;
		}
	}, [forceOverrideBgRenderer, backgroundType]);

	function normalizeFFTData(fftData: number[]): number[] {
		// Find the maximum value in the FFT data
		// let max = 0;
		// for (let i = 0; i < fftData.length; i++) {
		// 	if (fftData[i] > max) {
		// 		max = fftData[i];
		// 	}
		// }
		const max = Math.max.apply(Math, fftData);

		// Normalize the FFT data
		const normalizedData: number[] = [];
		for (let i = 0; i < fftData.length; i++) {
			normalizedData[i] = fftData[i] / max;
		}

		return normalizedData;
	}

	function calculateAmplitude(fftData: number[]): number[] {
		const amplitudes: number[] = [];
		// for (let i = 0; i < fftData.length; i += 2) {
		// 	const real = fftData[i];
		// 	const imaginary = fftData[i + 1];
		// 	const amplitude = Math.sqrt(real * real + imaginary * imaginary);
		// 	amplitudes.push(amplitude);
		// }
		for (let i = 0; i < fftData.length; i++) {
			let t = fftData[i];
			t = t * Math.min(((i + 5) / fftData.length) * 4, 1);
			amplitudes[i] = t * 2;
			amplitudes[i] /= 3;
		}
		return amplitudes;
	}

	function amplitudeToLevel(amplitude: number): number {
		const normalizedAmplitude = amplitude / 255;
		const level = 0.5 * Math.log10(normalizedAmplitude + 1);
		return level;
	}

	function calculateGradient(fftData: number[]): number {
		const window = 10;
		const volume =
			(amplitudeToLevel(fftData[0]) + amplitudeToLevel(fftData[1])) * 0.5;
		// const volume =
		// 	amplitudeToLevel(fftData[0]);
		// const volume =
		// 	amplitudeToLevel(fftData[1]);
		// const volume =
		// 	(amplitudeToLevel(fftData[0]) + amplitudeToLevel(fftData[1]) + amplitudeToLevel(fftData[2])) / 3.0;
		if (gradient.length < window && !gradient.includes(volume)) {
			gradient.push(volume);
			return 0;
		}
		gradient.shift();
		gradient.push(volume);

		const maxInInterval = Math.max(...gradient) ** 2;
		const minInInterval = Math.min(...gradient);
		const difference = maxInInterval - minInInterval;
		// console.log(volume, maxInInterval, minInInterval, difference);
		return difference > 0.35 ? maxInInterval : minInInterval * 0.5 ** 2;
	}

	let pausing = false;

	useLayoutEffect(() => {
		if (playstate === PlayState.Pausing) {
			pausing = true;
		} else {
			pausing = false;
		}
	}, [playstate]);

	useEffect(() => {
		let curValue = 1;

		let stopped = false;
		let lt = 0;
		let lastValue = 0;
		let count = 0;
		const onFrame = (dt: number) => {
			if (stopped) return;
			const delta = dt - lt;
			const fftData = globalStore.get(fftDataAtom);

			if (showBackgroundFFTLowFreq) setDbgValue(fftData.slice(0, 3));

			// const targetMaxValue = Math.max(
			// 	fftData[0],
			// 	Math.max(fftData[1], fftData[2]),
			// );
			// const maxValue = Math.max(targetMaxValue * 0.01 + 1000 * 0.99, 1000);

			// const value =
			// 	((Math.max(
			// 		(Math.sqrt(fftData[0] + fftData[1] + fftData[2]) / maxValue) * 1.5 -
			// 		0.2,
			// 		0.0,
			// 	) *
			// 		4.0 +
			// 		1.0) **
			// 		1.2 -
			// 		1.0) *
			// 	1.0;

			const gradient = calculateGradient(fftData);
			// let value = 0;

			// if (count === 20) {
			// 	value = gradient;
			// 	count = 0;
			// } else {
			// 	value = lastValue;
			// }

			// lastValue = value;
			let value = gradient;

			// console.log(playstate);

			if (pausing) {
				value = 0;
			}

			// count++;
			setLowFreqVolume(curValue);

			// if (Math.abs(value - lastValue) >= 0.9) {
			// 	lastValue = value;
			// } else if (value <= 0.1) {
			// 	lastValue = 0;
			// }

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
			backgroundType === BackgroundType.LiquidEplor ||
			backgroundType === BackgroundType.MeshLiquid ||
			backgroundType === BackgroundType.NewLiquidEplor ||
			backgroundType === BackgroundType.NewLiquidEplorTest
		) {
			return (
				<>
					<BackgroundRender
						className="amll-background-render-wrapper"
						staticMode={backgroundFakeLiquidStaticMode}
						disabled={!lyricPageOpened}
						album={musicCoverUrl}
						albumIsVideo={
							loadableMusicOverrideData.state === "hasData" &&
							loadableMusicOverrideData.data?.musicCoverIsVideo
						}
						fps={backgroundMaxFPS}
						lowFreqVolume={lowFreqVolume}
						renderScale={backgroundRenderScale}
						hasLyric={
							forceHasLyricsBackground
								? true
								: lyricLines.state === "hasData" && lyricLines.data.length > 0
									? true
									: lyricLines.state === "loading"
										? undefined
										: false
						}
						flowSpeed={flowSpeed}
						renderer={targetRenderer}
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
							<div>
								<div
									style={{
										position: "absolute",
										width: `${Math.min(lowFreqVolume * 100, 100)}px`,
										height: "10px",
										backgroundColor: "white",
									}}
								/>
								<div
									style={{
										position: "relative",
										width: `100px`,
										height: "10px",
										backgroundColor: "rgba(255, 255, 255, 0.2)",
									}}
								/>
							</div>
							{dbgValue.map((v) => (
								<div style={{ fontFamily: "monospace" }}>{v.toFixed(4)}</div>
							))}
						</div>
					)}
				</>
			);
		}
		if (backgroundType === BackgroundType.CustomSolidColor) {
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

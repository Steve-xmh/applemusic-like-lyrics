import * as React from "react";
import { useConfigValue, useConfigValueNumber } from "../../api/react";
import * as Weightings from "../../libs/a-weighting";
import { isNCMV3 } from "../../utils";
import { appendRegisterCall } from "../../utils/channel";
import { log, warn } from "../../utils/logger";
import AMLLFFTWASM from "../../../packages/fft/pkg/amll_fft_bg.wasm";
import initFFT, { AMLLFFT } from "../../../packages/fft/pkg/amll_fft";

// AudioData 48000hz int16 2 channels
let fft: AMLLFFT;
initFFT(AMLLFFTWASM).then(() => {
	fft = AMLLFFT.new(48000);
});

function getFFTData() {
	if (isNCMV3()) {
		try {
			const arr = fft?.process_fft() ?? new Float64Array();
			return [...arr];
		} catch (err) {
			warn("getFFTData", err);
			return [];
		}
	} else {
		return betterncm_native?.audio?.getFFTData(64) ?? [];
	}
}

function enableFFT() {
	if (isNCMV3()) {
		channel.call("audioplayer.enableAudioData", () => {}, [1]);
		log("enableFFT");
	} else {
		betterncm_native?.audio?.acquireFFTData();
	}
}

function disableFFT() {
	if (isNCMV3()) {
		channel.call("audioplayer.enableAudioData", () => {}, [0]);
		log("disableFFT");
	} else {
		betterncm_native?.audio?.releaseFFTData();
	}
}

if (isNCMV3()) {
	appendRegisterCall("AudioData", "audioplayer", (data: NCMV3AudioData) => {
		fft?.push_data(new Int16Array(data.data));
	});
}

function zoomArray(arr: number[], newSize: number): number[] {
	if (arr.length === 0) {
		return new Array(newSize).fill(0);
	} else if (newSize <= 0) {
		return [];
	} else if (arr.length === newSize) {
		return arr.slice();
	}
	const result = [];
	const isExpand = arr.length < newSize;
	let curFloorSumTimes = 0;
	let curFloorPos = 0;
	let curValue = 0;
	for (let i = 0; i < newSize; i++) {
		const oriPos = (i / newSize) * arr.length;
		const oriPosI = Math.floor(oriPos);
		const delta = oriPos - oriPosI;
		// console.log(curFloorSumTimes, curFloorPos, curValue, oriPos, oriPosI, delta)
		curValue += arr[oriPosI];
		if (oriPosI !== arr.length - 1 && isExpand) {
			curValue +=
				(arr[oriPosI + 1] - arr[oriPosI]) *
				(Math.sin(delta * Math.PI - Math.PI / 2) / 2 + 0.5);
		}
		curFloorSumTimes++;
		if (curFloorPos !== oriPosI || isExpand) {
			result.push(curValue / curFloorSumTimes);
			curFloorPos = oriPosI;
			curFloorSumTimes = 0;
			curValue = 0;
		}
	}
	// console.log(curFloorSumTimes, curFloorPos, curValue)
	while (result.length < newSize && !isExpand) {
		result.push(arr[arr.length - 1]);
	}
	return result;
}

// const toneMap = [
// 	20, 261.6255653, 277.182631, 293.6647679, 311.1269837, 329.6275569,
// 	349.2282314, 369.9944227, 391.995436, 415.3046976, 440, 466.1637615,
// 	493.8833013, 523.2511306, 554.365262, 587.3295358, 622.2539674, 659.2551138,
// 	698.4564629, 739.9888454, 783.990872, 830.6093952, 880, 932.327523,
// 	987.7666025, 1046.502261, 1108.730524, 1174.659072, 1244.507935, 1318.510228,
// 	1396.912926, 1479.977691, 1567.981744, 1661.21879, 1760, 1864.655046,
// 	1975.533205,
// ];

// function pickToneFromSpec(spec: number[], freq: number = 48000): number[] {
// 	freq /= 2;
// 	return toneMap.map((tone, i, arr) => {
// 		return spec[Math.floor(tone / freq * spec.length)]
// 	})
// }

interface NCMV3AudioData {
	data: ArrayBuffer;
	pts: number;
}

export const AudioFFTControl: React.FC = () => {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	const fftBarAmount = Math.min(
		256,
		Math.max(useConfigValueNumber("fftBarAmount", 64), 8),
	);
	const fftBarTweenSoftness = Math.max(
		0,
		Math.floor(useConfigValueNumber("fftBarTweenSoftness", 4)),
	);
	const fftBarThinkness = Math.max(
		1,
		useConfigValueNumber("fftBarThinkness", 2),
	);
	const fftWeightingMethod = useConfigValue("fftWeightingMethod", "");

	React.useLayoutEffect(() => {
		const canvas = canvasRef.current;

		if (canvas) {
			const ctx = canvas.getContext("2d");
			if (ctx) {
				enableFFT();
				return () => {
					disableFFT();
				};
			}
		}
	}, [canvasRef.current]);

	React.useLayoutEffect(() => {
		const canvas = canvasRef.current;

		if (canvas) {
			const ctx = canvas.getContext("2d");
			if (ctx) {
				const obs = new ResizeObserver((sizes) => {
					for (const size of sizes) {
						const target = size.target as HTMLCanvasElement;
						target.width = size.contentRect.width * window.devicePixelRatio;
						target.height = size.contentRect.height * window.devicePixelRatio;
					}
				});

				obs.observe(canvas);

				let stopped = false;
				let scale = 20;
				let fftData: number[] = [];

				function onFrame() {
					if (!(canvas && ctx) || stopped || !(betterncm.isMRBNCM || isNCMV3()))
						return;
					const width = canvas.width;
					const height = canvas.height;

					let rawData = getFFTData();

					const weighting: ((f: number) => number) | undefined =
						Weightings[fftWeightingMethod];

					if (weighting) {
						rawData.forEach((v, i, a) => {
							a[i] = v * weighting((i / a.length) * 24000);
						});
					}

					if (isNCMV3())
						rawData = rawData.splice(
							((rawData.length * 20) / 24000) | 0,
							((rawData.length * 2000) / 24000) | 0,
						);

					const data: number[] = zoomArray(rawData, fftBarAmount);

					const maxValue = Math.max.apply(Math, data);

					scale = (scale * 5 + Math.max(5, maxValue)) / 6;
					fftData = data.map(
						(v, i) =>
							((fftData[i] ?? 0) * fftBarTweenSoftness + v / scale) /
							(fftBarTweenSoftness + 1),
					);

					ctx.clearRect(0, 0, width, height);
					ctx.beginPath();

					const len = fftData.length;

					const barWidth = width / len;
					const harfBarWidth = barWidth / 2;

					ctx.strokeStyle = "white";
					ctx.lineWidth = fftBarThinkness * window.devicePixelRatio;
					ctx.lineCap = "round";
					ctx.lineJoin = "round";

					for (let i = 0; i < len; i++) {
						const x = barWidth * (i + 0.5);
						ctx.moveTo(x, height - harfBarWidth);
						ctx.lineTo(
							x,
							height - (harfBarWidth + (height - barWidth) * fftData[i]),
						);
					}

					ctx.stroke();

					requestAnimationFrame(onFrame);
				}

				onFrame();

				return () => {
					obs.disconnect();
					stopped = true;
				};
			}
		}
	}, [
		fftBarAmount,
		canvasRef.current,
		fftBarTweenSoftness,
		fftWeightingMethod,
		fftBarThinkness,
	]);

	return (
		<canvas
			style={{
				width: "100%",
				height: "100%",
			}}
			ref={canvasRef}
		/>
	);
};

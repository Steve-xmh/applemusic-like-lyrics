import * as React from "react";
import { useConfigValue, useConfigValueNumber } from "../../api/react";
import * as Weightings from "../../libs/a-weighting";
import { isNCMV3 } from "../../utils";
import { appendRegisterCall } from "../../utils/channel";
import { log, warn } from "../../utils/logger";
import AMLLFFTWASM from "../../../amll-fft/pkg/amll_fft_bg.wasm";
import initFFT, { AMLLFFT } from "../../../amll-fft/pkg";

// AudioData 48000hz int16 2 channels
let fft: AMLLFFT;
initFFT(AMLLFFTWASM).then(() => {
	fft = AMLLFFT.new(48000);
});

let aly: AnalyserNode;

function getFFTData() {
	if (isNCMV3() && aly) {
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
	const actx = new AudioContext();
	aly = new AnalyserNode(actx, {
		smoothingTimeConstant: 0,
		fftSize: 128,
	});
	// aly.connect(actx.destination);

	appendRegisterCall("AudioData", "audioplayer", (data: NCMV3AudioData) => {
		fft?.push_data(new Int16Array(data.data));
		// const abuf = actx.createBuffer(2, data.data.byteLength / 4, 48000);
		// const buf = new Int16Array(data.data);
		// abuf.copyToChannel(new Float32Array(int16ToFloat32(buf, 0)), 0);
		// abuf.copyToChannel(new Float32Array(int16ToFloat32(buf, 1)), 1);
		// const node = new AudioBufferSourceNode(actx, {
		// 	buffer: abuf,
		// });
		// node.connect(aly);
		// node.onended = () => node.disconnect();
		// node.start();
	});
}

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
							((rawData.length * 50) / 24000) | 0,
							((rawData.length * 4000) / 24000) | 0,
						);

					const data: number[] = rawData;

					fftBarAmount;
					const chunkSize = Math.ceil(rawData.length / fftBarAmount);

					for (let i = 0; i < rawData.length; i += chunkSize) {
						let t = 0;
						for (let j = 0; j < chunkSize; j++) {
							t += rawData[Math.min(rawData.length - 1, i + j)];
						}
						data.push(20 * Math.log10(t / chunkSize));
					}

					data.splice(fftBarAmount);

					const maxValue = data.reduce((pv, cv) => (cv > pv ? cv : pv), 0);

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

					// if (isNCMV3()) {
					// 	const weighting: ((f: number) => number) | undefined =
					// 		Weightings[fftWeightingMethod];

					// 	if (weighting) {
					// 		ctx.strokeStyle = "red";
					// 		ctx.lineWidth = window.devicePixelRatio;
					// 		ctx.beginPath();
					// 		ctx.moveTo(0, 0);
					// 		for (let i = 0; i < rawData.length; i++) {
					// 			const x = (i / rawData.length) * width;
					// 			ctx.lineTo(
					// 				x,
					// 				height * (1 - weighting(i / rawData.length * 10000)),
					// 			);
					// 		}
					// 		ctx.stroke();
					// 	}
					// }

					requestAnimationFrame(onFrame);
				}

				onFrame();

				return () => {
					disableFFT();
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

	return <canvas className="am-audio-fft" ref={canvasRef} />;
};

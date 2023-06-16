import * as React from "react";
import { useConfigValue, useConfigValueNumber } from "../../api/react";
import * as Weightings from "../../libs/a-weighting";
import { isNCMV3 } from "../../utils";
import { appendRegisterCall } from "../../utils/channel";
import { log, warn } from "../../utils/logger";

// AudioData 48000hz int16 2 channels

interface Complex {
	real: number;
	imag: number;
}

const newComplex = (r: number, i: number): Complex => {
	return {
		real: r,
		imag: i,
	};
};

const dft = (samples: Complex[]): Complex[] => {
	const len = samples.length;
	const ilen = 1 / len;
	const result: Complex[] = new Array(len);
	const TAU = Math.PI * 2;
	for (let i = 0; i < len; i++) {
		result[i] = newComplex(0, 0);
		for (let n = 0; n < len; n++) {
			const theta = TAU * i * n * ilen;
			const ctheta = Math.cos(theta);
			const stheta = Math.sin(theta);
			result[i].real += samples[n].real * ctheta - samples[n].imag * stheta;
			result[i].imag += samples[n].imag * stheta + samples[n].real * ctheta;
		}
		result[i].real *= ilen;
		result[i].imag *= ilen;
	}
	return result;
};

function* int16ToFloat32(buf: Int16Array, offset = 0) {
	for (let i = offset; i < buf.length; i += 2) {
		yield buf[i] / 2 ** 16;
	}
}

let aly: AnalyserNode;

function getFFTData() {
	if (isNCMV3() && aly) {
		const buf = new Uint8Array(aly.frequencyBinCount);
		try {
			aly.getByteFrequencyData(buf);
			return [...buf];
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
		betterncm_native.audio.acquireFFTData();
	}
}

function disableFFT() {
	if (isNCMV3()) {
		channel.call("audioplayer.enableAudioData", () => {}, [0]);
		log("disableFFT");
	} else {
		betterncm_native.audio.releaseFFTData();
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
		const abuf = actx.createBuffer(2, data.data.byteLength / 4, 48000);
		const buf = new Int16Array(data.data);
		abuf.copyToChannel(new Float32Array(int16ToFloat32(buf, 0)), 0);
		abuf.copyToChannel(new Float32Array(int16ToFloat32(buf, 1)), 1);
		const node = new AudioBufferSourceNode(actx, {
			buffer: abuf,
		});
		node.connect(aly);
		node.onended = () => node.disconnect();
		node.start();
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

					if (!isNCMV3()) {
						const weighting: ((f: number) => number) | undefined =
							Weightings[fftWeightingMethod];

						if (weighting) {
							rawData.forEach((v, i, a) => {
								a[i] = v * weighting(((i + 1) / a.length) ** 2 * 22000 + 50);
							});
						}
					}

					const data: number[] = rawData;

					// fftBarAmount
					// const chunkSize = Math.ceil(rawData.length / fftBarAmount);

					// for (let i = 0; i < rawData.length; i += chunkSize) {
					// 	let t = 0;
					// 	for (let j = 0; j < chunkSize; j++) {
					// 		t += rawData[Math.min(rawData.length - 1, i + j)];
					// 	}
					// 	data.push(t / chunkSize);
					// }

					// data.splice(fftBarAmount);

					const maxValue = data.reduce((pv, cv) => (cv > pv ? cv : pv), 0);

					scale = (scale * 5 + Math.max(1, maxValue)) / 6;
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

					ctx.closePath();
					ctx.stroke();

					// ctx.strokeStyle = "red";
					// const debugWidth = width / rawData.length;
					// ctx.lineWidth = debugWidth;
					// ctx.beginPath();

					// rawData.forEach((v, i, a) => {
					// 	const x = debugWidth * (i + 0.5);
					// 	ctx.moveTo(x, height - debugWidth / 2);
					// 	ctx.lineTo(
					// 		x,
					// 		height - (debugWidth / 2 + (height - barWidth) * (v / 255)),
					// 	);
					// });

					// ctx.closePath();
					// ctx.stroke();

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

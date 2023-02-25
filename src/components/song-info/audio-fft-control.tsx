import * as React from "react";
import { useConfigValue, useConfigValueNumber } from "../../api/react";
import * as Weightings from "../../libs/a-weighting";

export const AudioFFTControl: React.FC = () => {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);

	const fftBarAmount = Math.min(
		64,
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
				betterncm_native.audio.acquireFFTData();

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
					if (!(canvas && ctx) || stopped || !betterncm.isMRBNCM) return;
					const width = canvas.width;
					const height = canvas.height;

					let rawData = betterncm_native?.audio?.getFFTData(64) ?? [];

					const weighting: ((f: number) => number) | undefined =
						Weightings[fftWeightingMethod];

					if (weighting) {
						rawData.forEach((v, i, a) => {
							a[i] = v * weighting(((i + 1) / a.length) ** 2 * 22000 + 50);
						});
					}

					rawData.splice(64);

					const data: number[] = [];

					// fftBarAmount
					const chunkSize = Math.ceil(rawData.length / fftBarAmount);

					for (let i = 0; i < rawData.length; i += chunkSize) {
						let t = 0;
						for (let j = 0; j < chunkSize; j++) {
							t += rawData[Math.min(rawData.length - 1, i + j)];
						}
						data.push(t / chunkSize);
					}

					data.splice(fftBarAmount);

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

					requestAnimationFrame(onFrame);
				}

				onFrame();

				return () => {
					betterncm_native.audio.releaseFFTData();
					obs.disconnect();
					stopped = true;
				};
			}
		}
	}, [fftBarAmount, fftBarTweenSoftness, fftWeightingMethod, fftBarThinkness]);

	return <canvas className="am-audio-fft" ref={canvasRef} />;
};

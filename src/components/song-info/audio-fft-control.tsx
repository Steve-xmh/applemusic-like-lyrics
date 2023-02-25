import * as React from "react";

export const AudioFFTControl: React.FC = () => {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);

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

					let data = betterncm_native?.audio?.getFFTData(64) ?? [];

					const maxValue = data.reduce((pv, cv) => (cv > pv ? cv : pv), 0);

					scale = (scale * 5 + Math.max(2, maxValue)) / 6;
					fftData = data.map((v, i) => ((fftData[i] ?? 0) * 4 + v / scale) / 5);

					ctx.clearRect(0, 0, width, height);
					ctx.beginPath();

					const len = fftData.length;

					const barWidth = width / len;
					const barThinkness = Math.min(
						2 * window.devicePixelRatio,
						barWidth / 2,
					);
					const harfBarWidth = barWidth / 2;

					ctx.strokeStyle = "white";
					ctx.lineWidth = barThinkness * window.devicePixelRatio;
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
	}, []);

	return <canvas className="am-audio-fft" ref={canvasRef} />;
};

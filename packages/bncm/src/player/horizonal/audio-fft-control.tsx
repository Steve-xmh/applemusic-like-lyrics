import { useRef, FC, useLayoutEffect } from "react";
import { useAtomValue } from "jotai";
import { musicContextAtom } from "../../music-context/wrapper";

import { globalStore } from "../../injector";
import { fftDataAtom } from "../common/fft-context";

export const AudioFFTControl: FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const musicCtx = useAtomValue(musicContextAtom);

	useLayoutEffect(() => {
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

				let maxValue = 100;
				let stopped = false;

				let buf: number[] = [];

				function onFrame() {
					if (!(canvas && ctx) || stopped) return;
					const width = canvas.width;
					const height = canvas.height;

					let processed = globalStore.get(fftDataAtom);
					if (buf.length !== processed.length) {
						buf = [...processed];
					} else {
						for (let i = 0; i < buf.length; i++) {
							let t = processed[i];
							t = t * Math.min(((i + 5) / buf.length) * 4, 1);
							buf[i] += t * 2;
							buf[i] /= 3;
						}
					}

					ctx.clearRect(0, 0, width, height);
					{
						ctx.beginPath();
						const targetMaxValue = Math.max.apply(Math, buf);
						maxValue = Math.max(targetMaxValue * 0.1 + maxValue * 0.9, 100);

						const len = buf.length;

						const barWidth = width / len;

						ctx.strokeStyle = "white";
						ctx.lineWidth = 4 * window.devicePixelRatio;
						ctx.lineCap = "round";
						ctx.lineJoin = "round";

						for (let i = 0; i < buf.length; i++) {
							const x = barWidth * (i + 0.5);
							ctx.moveTo(x, height - barWidth);
							ctx.lineTo(
								x,
								height -
									barWidth -
									Math.min(1, Math.max(0, buf[i] / maxValue)) ** 2 *
										(height - barWidth * 2),
							);
						}

						ctx.stroke();
					}

					requestAnimationFrame(onFrame);
				}

				onFrame();

				musicCtx?.acquireAudioData();
				return () => {
					obs.disconnect();
					musicCtx?.releaseAudioData();
					stopped = true;
				};
			}
		}
	}, [canvasRef.current, musicCtx]);

	return (
		<canvas
			style={{
				width: "100%",
				height: "5vh",
			}}
			ref={canvasRef}
		/>
	);
};

import { useRef, FC, useLayoutEffect, MutableRefObject } from "react";
import { appendRegisterCall } from "../../utils/channel";
import { log, warn } from "../../utils/logger";
import { SoundProcessor } from "../../utils/fft";
import { useAtomValue } from "jotai";
import { musicContextAtom } from "../../music-context/wrapper";
import { MusicStatusGetterEvents } from "../../music-context";

import { AMLLFFT } from "@applemusic-like-lyrics/fft";
import PCMPlayer from "../../utils/pcm-player";

// AudioData 48000hz int16 2 channels

interface NCMV3AudioData {
	data: ArrayBuffer;
	pts: number;
}

export const AudioFFTControl: FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const musicCtx = useAtomValue(musicContextAtom);

	// const fftWeightingMethod = useConfigValue("fftWeightingMethod", "");
	const soundProcessor = useRef() as MutableRefObject<SoundProcessor>;
	if (soundProcessor.current === undefined) {
		soundProcessor.current = new SoundProcessor({
			filterParams: {
				sigma: 1,
				radius: 2,
			},
			sampleRate: 48000,
			fftSize: 1024,
			outBandsQty: 512,
			startFrequency: 150,
			endFrequency: 4500,
			aWeight: true,
		});
	}
	const amllFFT = useRef() as MutableRefObject<PCMPlayer>;
	if (amllFFT.current === undefined) {
		amllFFT.current = new PCMPlayer({
			inputCodec: "Int16",
			channels: 2,
			sampleRate: 48000,
			flushTime: 50,
		});
	}

	useLayoutEffect(() => {
		return () => {
			amllFFT.current.destroy();
			(amllFFT.current as unknown) = undefined;
		};
	}, []);

	useLayoutEffect(() => {
		const canvas = canvasRef.current;

		if (canvas) {
			const ctx = canvas.getContext("2d");
			if (ctx) {
				musicCtx?.acquireAudioData();
				return () => {
					musicCtx?.releaseAudioData();
				};
			}
		}
	}, [canvasRef.current]);

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

				// const audioStream: number[] = [];

				const onAudioData = (evt: MusicStatusGetterEvents["audio-data"]) => {
					amllFFT.current.feed(evt.detail.data);
				};

				musicCtx?.addEventListener("audio-data", onAudioData);

				obs.observe(canvas);

				let stopped = false;

				const fftData = amllFFT.current.createFrequencyData();
				soundProcessor.current = new SoundProcessor({
					filterParams: {
						sigma: 1,
						radius: 1,
					},
					sampleRate: 48000,
					fftSize: fftData.length,
					outBandsQty: 61,
					startFrequency: 150,
					endFrequency: 24000,
					aWeight: true,
				});
				let maxValue = 1;

				function onFrame(time: number) {
					if (!(canvas && ctx) || stopped) return;
					const width = canvas.width;
					const height = canvas.height;
					// const curData = audioStream.splice(
					// 	0,
					// 	(48000 * (time - lastTime)) / 1000,
					// );
					// audioStream.splice(6000, Infinity);
					amllFFT.current.getByteFrequencyData(fftData);
					// const processed = fftData.slice(0, fftData.length * 7500 / 24000)
					const processed = soundProcessor.current.process(fftData);
					// const data = soundProcessor.current.process(processed);

					ctx.clearRect(0, 0, width, height);
					{
						ctx.beginPath();
						const targetMaxValue = Math.max.apply(Math, processed);
						maxValue = targetMaxValue * 0.1 + maxValue * 0.9;

						const len = processed.length;

						const barWidth = width / len;

						// ctx.fillStyle = "white";
						// ctx.fillText(`maxValue: ${maxValue}`, 0, 16);

						ctx.strokeStyle = "white";
						ctx.lineWidth = 4 * window.devicePixelRatio;
						ctx.lineCap = "round";
						ctx.lineJoin = "round";

						for (let i = 0; i < processed.length; i++) {
							const x = barWidth * (i + 0.5);
							ctx.moveTo(x, height - barWidth);
							// ctx.lineTo(
							// 	x,
							// 	height - (harfBarWidth + (height - barWidth) * data[i]),
							// );
							ctx.lineTo(
								x,
								height -
									barWidth -
									Math.min(1, Math.max(0, processed[i] / maxValue)) ** 2 *
										(height - barWidth * 2),
							);
						}

						ctx.stroke();
					}

					// {
					// 	ctx.beginPath();
					// 	ctx.strokeStyle = "white";
					// 	ctx.lineWidth = 1 * window.devicePixelRatio;
					// 	const dbgBarWidth = width / curData.length;
					// 	for (let i = 0; i < curData.length; i++) {
					// 		const x = dbgBarWidth * (i + 0.5);
					// 		// ctx.moveTo(x, height / 2);
					// 		ctx.lineTo(x, ((curData[i] / 512 - 0.5) * height + height / 2));
					// 	}

					// 	ctx.stroke();
					// }

					requestAnimationFrame(onFrame);
				}

				onFrame(0);

				return () => {
					obs.disconnect();
					musicCtx?.removeEventListener("audio-data", onAudioData);
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

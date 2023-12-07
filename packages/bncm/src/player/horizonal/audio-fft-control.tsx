import { useRef, FC, useLayoutEffect, MutableRefObject } from "react";
import { SoundProcessor } from "../../utils/fft";
import { useAtomValue } from "jotai";
import { musicContextAtom, playStatusAtom } from "../../music-context/wrapper";
import { MusicStatusGetterEvents, PlayState } from "../../music-context";

import PCMPlayer from "../../utils/pcm-player";
import { processBarFFTAtom } from "../../components/config/atoms";

export const AudioFFTControl: FC = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const musicCtx = useAtomValue(musicContextAtom);
	const processBarFFT = useAtomValue(processBarFFTAtom);
	const playstate = useAtomValue(playStatusAtom);

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
		if (playstate === PlayState.Playing) {
			amllFFT.current.continue();
		}
	}, [playstate]);

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
					amllFFT.current.continue();
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
					startFrequency: 100,
					endFrequency: 14000,
					aWeight: true,
				});
				let maxValue = 1;

				function onFrame() {
					if (!(canvas && ctx) || stopped) return;
					const width = canvas.width;
					const height = canvas.height;
					amllFFT.current.getByteFrequencyData(fftData);

					let processed: number[];
					if (processBarFFT)
						processed = soundProcessor.current.process(fftData);
					else {
						processed = soundProcessor.current.divide(fftData);
					}

					ctx.clearRect(0, 0, width, height);
					{
						ctx.beginPath();
						const targetMaxValue = Math.max.apply(Math, processed);
						maxValue = Math.max(targetMaxValue * 0.1 + maxValue * 0.9, 100);

						const len = processed.length;

						const barWidth = width / len;

						ctx.strokeStyle = "white";
						ctx.lineWidth = 4 * window.devicePixelRatio;
						ctx.lineCap = "round";
						ctx.lineJoin = "round";

						for (let i = 0; i < processed.length; i++) {
							const x = barWidth * (i + 0.5);
							ctx.moveTo(x, height - barWidth);
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

					requestAnimationFrame(onFrame);
				}

				onFrame();

				return () => {
					obs.disconnect();
					musicCtx?.removeEventListener("audio-data", onAudioData);
					stopped = true;
				};
			}
		}
	}, [canvasRef.current, musicCtx, processBarFFT]);

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

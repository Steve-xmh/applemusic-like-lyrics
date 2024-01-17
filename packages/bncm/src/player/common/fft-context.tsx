import { atom, useAtomValue, useSetAtom } from "jotai";
import { FC, useLayoutEffect, useRef } from "react";
import { musicContextAtom, playStatusAtom } from "../../music-context/wrapper";
import { processBarFFTAtom } from "../../components/config/atoms";
import { SoundProcessor } from "../../utils/fft";
import { MusicStatusGetterEvents, PlayState } from "../../music-context";
import PCMPlayer from "../../utils/pcm-player";

export const fftDataAtom = atom([] as number[]);

export const AudioFFTContext: FC = () => {
	const musicCtx = useAtomValue(musicContextAtom);
	const processBarFFT = useAtomValue(processBarFFTAtom);
	const playstate = useAtomValue(playStatusAtom);
	const setFFTData = useSetAtom(fftDataAtom);
	const soundProcessor = useRef<SoundProcessor>();
	const amllFFT = useRef<PCMPlayer>();

	useLayoutEffect(() => {
		amllFFT.current = new PCMPlayer({
			inputCodec: "Int16",
			channels: 2,
			sampleRate: 48000,
			flushTime: 50,
		});
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
		return () => {
			amllFFT.current?.destroy();
			amllFFT.current = undefined;
			soundProcessor.current = undefined;
		};
	}, []);

	useLayoutEffect(() => {
		if (playstate === PlayState.Playing) {
			amllFFT.current?.continue();
		}
	}, [playstate]);

	useLayoutEffect(() => {
		const fft = amllFFT.current;
		if (!fft) return;
		let isFFTMode = false;
		let ctxFFTData: number[] = [];

		const onAudioData = (evt: MusicStatusGetterEvents["audio-data"]) => {
			isFFTMode = false;
			fft.feed(evt.detail.data);
			fft.continue();
		};

		const onFFTData = (evt: MusicStatusGetterEvents["fft-data"]) => {
			isFFTMode = true;
			ctxFFTData = evt.detail.data;
		};

		musicCtx?.addEventListener("audio-data", onAudioData);
		musicCtx?.addEventListener("fft-data", onFFTData);

		let stopped = false;

		const fftData = fft.createFrequencyData();
		soundProcessor.current = new SoundProcessor({
			filterParams: {
				sigma: 1,
				radius: 1,
			},
			sampleRate: 48000,
			fftSize: fftData.length,
			outBandsQty: 61,
			startFrequency: 60,
			endFrequency: 14000,
			aWeight: true,
		});

		function onFrame() {
			if (stopped) return;
			let processed: number[];

			if (isFFTMode) {
				processed = ctxFFTData;
			} else {
				amllFFT.current?.getByteFrequencyData(fftData);
				if (processBarFFT)
					processed = soundProcessor.current?.process(fftData) ?? [...fftData];
				else {
					processed = soundProcessor.current?.divide(fftData) ?? [...fftData];
				}
			}
			setFFTData(processed);

			requestAnimationFrame(onFrame);
		}

		onFrame();

		return () => {
			musicCtx?.removeEventListener("audio-data", onAudioData);
			musicCtx?.removeEventListener("fft-data", onFFTData);
			stopped = true;
		};
	}, [musicCtx, amllFFT.current, processBarFFT]);

	return null;
};

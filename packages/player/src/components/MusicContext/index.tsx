import {
	fftDataAtom,
	lowFreqVolumeAtom,
	hideLyricViewAtom,
	isLyricPageOpenedAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicCoverAtom,
	musicCoverIsVideoAtom,
	musicDurationAtom,
	musicNameAtom,
	musicPlayingAtom,
	musicPlayingPositionAtom,
	musicVolumeAtom,
	onClickControlThumbAtom,
	onPlayOrResumeAtom,
	onRequestNextSongAtom,
	onRequestPrevSongAtom,
	onSeekPositionAtom,
	AudioQualityType,
	musicQualityAtom,
} from "@applemusic-like-lyrics/react-full";
import { useStore } from "jotai";
import { useEffect, type FC } from "react";
import {
	emitAudioThreadRet,
	emitAudioThread,
	listenAudioThreadEvent,
	type AudioInfo,
	type AudioQuality,
} from "../../utils/player";
import { musicIdAtom } from "../../states";

function useFFTToLowPass() {
	const store = useStore();

	useEffect(() => {
		let rafId: number;
		let curValue = 1;
		let lt = 0;

		const gradient: number[] = [];

		function amplitudeToLevel(amplitude: number): number {
			const normalizedAmplitude = amplitude / 255;
			const level = 0.5 * Math.log10(normalizedAmplitude + 1);
			return level;
		}

		function calculateGradient(fftData: number[]): number {
			const window = 10;
			const volume =
				(amplitudeToLevel(fftData[0]) + amplitudeToLevel(fftData[1])) * 0.5;
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

		const onFrame = (dt: number) => {
			const fftData = store.get(fftDataAtom);

			const delta = dt - lt;
			const gradient = calculateGradient(fftData);

			const value = gradient;

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

			if (Number.isNaN(curValue)) curValue = 1;

			store.set(lowFreqVolumeAtom, curValue);

			lt = dt;
			rafId = requestAnimationFrame(onFrame);
		};
		rafId = requestAnimationFrame(onFrame);
		return () => {
			cancelAnimationFrame(rafId);
		};
	}, [store]);
}

export const MusicContext: FC = () => {
	const store = useStore();

	useFFTToLowPass();

	useEffect(() => {
		const toEmitThread = (type: Parameters<typeof emitAudioThread>[0]) => ({
			onEmit() {
				emitAudioThread(type);
			},
		});
		const toEmit = (onEmit) => ({
			onEmit,
		});
		store.set(onRequestNextSongAtom, toEmitThread("nextSong"));
		store.set(onRequestPrevSongAtom, toEmitThread("prevSong"));
		store.set(onPlayOrResumeAtom, toEmitThread("resumeOrPauseAudio"));
		store.set(
			onClickControlThumbAtom,
			toEmit(() => {
				store.set(isLyricPageOpenedAtom, false);
			}),
		);
		store.set(
			onSeekPositionAtom,
			toEmit((time: number) => {
				emitAudioThread("seekAudio", {
					position: time / 1000,
				});
			}),
		);
		store.set(hideLyricViewAtom, true); // TODO: 暂无歌词
		const syncMusicInfo = (musicInfo: AudioInfo) => {
			console.log("已设置音乐信息", musicInfo);
			store.set(musicNameAtom, musicInfo.name);
			store.set(musicAlbumNameAtom, musicInfo.album);
			store.set(
				musicArtistsAtom,
				musicInfo.artist.split("/").map((v) => ({
					id: v.trim(),
					name: v.trim(),
				})),
			);
			store.set(musicPlayingPositionAtom, (musicInfo.position * 1000) | 0);
			store.set(musicDurationAtom, (musicInfo.duration * 1000) | 0);
			if (musicInfo.cover) {
				const imgBlob = new Blob([new Uint8Array(musicInfo.cover)], {
					type: "image",
				});
				const imgUrl = URL.createObjectURL(imgBlob);
				try {
					const oldUrl = store.get(musicCoverAtom);
					if (oldUrl.startsWith("blob:")) {
						URL.revokeObjectURL(oldUrl);
					}
				} catch (e) {
					console.warn(e);
				}
				store.set(musicCoverAtom, imgUrl);
				store.set(musicCoverIsVideoAtom, false);
			} else {
				store.set(
					musicCoverAtom,
					"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
				);
				store.set(musicCoverIsVideoAtom, false);
			}
		};
		const syncMusicQuality = (quality: AudioQuality) => {
			console.log("已设置音乐音质信息", quality);
			let result = AudioQualityType.None;
			if (quality.codec === "flac") {
				result = AudioQualityType.Lossless;
				if ((quality.sampleRate || 0) > 48000) {
					result = AudioQualityType.HiRes;
				}
				if ((quality.channels || 0) > 2) {
					result = AudioQualityType.DolbyAtmos;
				}
			}
			store.set(musicQualityAtom, result);
		};
		const unlistenPromise = listenAudioThreadEvent((evt) => {
			const evtData = evt.payload.data;
			switch (evtData.type) {
				case "playPosition": {
					store.set(
						musicPlayingPositionAtom,
						(evtData.data.position * 1000) | 0,
					);
					break;
				}
				case "loadProgress": {
					break;
				}
				case "loadAudio": {
					store.set(musicIdAtom, evtData.data.musicId);
					syncMusicQuality(evtData.data.quality);
					syncMusicInfo(evtData.data.musicInfo);
					break;
				}
				case "loadingAudio": {
					break;
				}
				case "syncStatus": {
					store.set(musicPlayingAtom, evtData.data.isPlaying);
					store.set(musicIdAtom, evtData.data.musicId);
					syncMusicQuality(evtData.data.quality);
					syncMusicInfo(evtData.data.musicInfo);
					break;
				}
				case "playStatus": {
					store.set(musicPlayingAtom, evtData.data.isPlaying);
					break;
				}
				case "setDuration": {
					store.set(musicDurationAtom, evtData.data.duration);
					break;
				}
				case "loadError": {
					break;
				}
				case "volumeChanged": {
					store.set(musicVolumeAtom, evtData.data.volume);
					break;
				}
				case "fftData": {
					store.set(fftDataAtom, evtData.data.data);
					break;
				}
			}
		});
		emitAudioThreadRet("syncStatus");
		return () => {
			unlistenPromise.then((unlisten) => unlisten());
		};
	}, [store]);

	return null;
};

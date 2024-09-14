import {
	parseEslrc,
	parseLrc,
	parseLys,
	parseQrc,
	parseTTML,
	parseYrc,
} from "@applemusic-like-lyrics/lyric";
import {
	AudioQualityType,
	fftDataAtom,
	hideLyricViewAtom,
	isLyricPageOpenedAtom,
	lowFreqVolumeAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicCoverAtom,
	musicCoverIsVideoAtom,
	musicDurationAtom,
	musicLyricLinesAtom,
	musicNameAtom,
	musicPlayingAtom,
	musicPlayingPositionAtom,
	musicQualityAtom,
	musicVolumeAtom,
	onChangeVolumeAtom,
	onClickControlThumbAtom,
	onPlayOrResumeAtom,
	onRequestNextSongAtom,
	onRequestPrevSongAtom,
	onSeekPositionAtom,
} from "@applemusic-like-lyrics/react-full";
import { useLiveQuery } from "dexie-react-hooks";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { type FC, useEffect } from "react";
import { db } from "../../dexie";
import { fftDataRangeAtom, musicIdAtom } from "../../states";
import {
	type AudioInfo,
	type AudioQuality,
	emitAudioThread,
	emitAudioThreadRet,
	listenAudioThreadEvent,
} from "../../utils/player";

const FFTToLowPassContext: FC = () => {
	const store = useStore();
	const fftDataRange = useAtomValue(fftDataRangeAtom);

	useEffect(() => {
		emitAudioThread("setFFTRange", {
			fromFreq: fftDataRange[0],
			toFreq: fftDataRange[1],
		});
	}, [fftDataRange]);

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

	return null;
};

const LyricContext: FC = () => {
	const musicId = useAtomValue(musicIdAtom);
	const setLyricLines = useSetAtom(musicLyricLinesAtom);
	const setHideLyricView = useSetAtom(hideLyricViewAtom);
	const song = useLiveQuery(() => db.songs.get(musicId), [musicId]);

	useEffect(() => {
		if (song) {
			try {
				switch (song.lyricFormat) {
					case "lrc": {
						const lyric = parseLrc(song.lyric);
						console.log("解析出 LyRiC 歌词", lyric);
						setLyricLines(lyric);
						setHideLyricView(false);
						break;
					}
					case "eslrc": {
						const lyric = parseEslrc(song.lyric);
						console.log("解析出 ESLyRiC 歌词", lyric);
						setLyricLines(lyric);
						setHideLyricView(false);
						break;
					}
					case "yrc": {
						const lyric = parseYrc(song.lyric);
						console.log("解析出 YRC 歌词", lyric);
						setLyricLines(lyric);
						setHideLyricView(false);
						break;
					}
					case "qrc": {
						const lyric = parseQrc(song.lyric);
						console.log("解析出 QRC 歌词", lyric);
						setLyricLines(lyric);
						setHideLyricView(false);
						break;
					}
					case "lys": {
						const lyric = parseLys(song.lyric);
						console.log("解析出 Lyricify Syllable 歌词", lyric);
						setLyricLines(lyric);
						setHideLyricView(false);
						break;
					}
					case "ttml": {
						const lyric = parseTTML(song.lyric);
						setLyricLines(lyric.lines);
						setHideLyricView(false);
						break;
					}
					default:
						setLyricLines([]);
						setHideLyricView(true);
				}
			} catch (e) {
				console.warn("解析歌词时出现错误", e);
				setLyricLines([]);
				setHideLyricView(true);
			}
		} else {
			setLyricLines([]);
			setHideLyricView(true);
		}
	}, [song, setLyricLines, setHideLyricView]);

	return null;
};

export const MusicContext: FC = () => {
	const store = useStore();

	useEffect(() => {
		const toEmitThread = (type: Parameters<typeof emitAudioThread>[0]) => ({
			onEmit() {
				emitAudioThread(type);
			},
		});
		const toEmit = <T,>(onEmit: T) => ({
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
		store.set(
			onChangeVolumeAtom,
			toEmit((volume: number) => {
				emitAudioThread("setVolume", {
					volume,
				});
			}),
		);
		const syncMusicInfo = (
			musicInfo: AudioInfo,
			musicId = store.get(musicIdAtom),
		) => {
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

			db.songs.get(musicId).then((song) => {
				if (song) {
					const imgUrl = URL.createObjectURL(song.cover);
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
				} else if (musicInfo.cover) {
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
			});
		};
		const syncMusicId = (musicId: string) => {
			if (musicId.startsWith("local:")) {
				store.set(musicIdAtom, musicId.substring(6));
			} else {
				store.set(musicIdAtom, musicId);
			}
		};
		const syncMusicQuality = (quality: AudioQuality) => {
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
					syncMusicId(evtData.data.musicId);
					syncMusicQuality(evtData.data.quality);
					syncMusicInfo(evtData.data.musicInfo);
					break;
				}
				case "loadingAudio": {
					syncMusicId(evtData.data.musicId);
					break;
				}
				case "syncStatus": {
					store.set(musicPlayingAtom, evtData.data.isPlaying);
					store.set(musicVolumeAtom, evtData.data.volume);
					syncMusicId(evtData.data.musicId);
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

	return (
		<>
			<LyricContext />
			<FFTToLowPassContext />
		</>
	);
};

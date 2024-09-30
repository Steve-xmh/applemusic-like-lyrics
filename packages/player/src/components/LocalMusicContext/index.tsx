import type { LyricLine as CoreLyricLine } from "@applemusic-like-lyrics/core";
import {
	type LyricLine,
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
	onClickLeftFunctionButtonAtom,
	onClickRightFunctionButtonAtom,
	onLyricLineClickAtom,
	onPlayOrResumeAtom,
	onRequestNextSongAtom,
	onRequestOpenMenuAtom,
	onRequestPrevSongAtom,
	onSeekPositionAtom,
} from "@applemusic-like-lyrics/react-full";
import { useLiveQuery } from "dexie-react-hooks";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { type FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { db } from "../../dexie";
import {
	advanceLyricDynamicLyricTimeAtom,
	fftDataRangeAtom,
	musicIdAtom,
} from "../../states";
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
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);

	useEffect(() => {
		emitAudioThread("setFFTRange", {
			fromFreq: fftDataRange[0],
			toFreq: fftDataRange[1],
		});
	}, [fftDataRange]);

	useEffect(() => {
		if (!isLyricPageOpened) return;
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
	}, [store, isLyricPageOpened]);

	return null;
};

type TransLine = {
	[K in keyof CoreLyricLine]: CoreLyricLine[K] extends string ? K : never;
}[keyof CoreLyricLine];

function pairLyric(line: LyricLine, lines: CoreLyricLine[], key: TransLine) {
	if (
		line.words
			.map((v) => v.word)
			.join("")
			.trim().length === 0
	)
		return;
	interface PairedLine {
		startTime: number;
		lineText: string;
		origIndex: number;
		original: CoreLyricLine;
	}
	const processed: PairedLine[] = lines.map((v, i) => ({
		startTime: Math.min(v.startTime, ...v.words.map((v) => v.startTime)),
		origIndex: i,
		lineText: v.words
			.map((v) => v.word)
			.join("")
			.trim(),
		original: v,
	}));
	let nearestLine: PairedLine | undefined = undefined;
	for (const coreLine of processed) {
		if (coreLine.lineText.length > 0) {
			if (coreLine.startTime === line.words[0].startTime) {
				nearestLine = coreLine;
				break;
			}
			if (
				nearestLine &&
				Math.abs(nearestLine.startTime - line.words[0].startTime) >
					Math.abs(coreLine.startTime - line.words[0].startTime)
			) {
				nearestLine = coreLine;
			} else if (nearestLine === undefined) {
				nearestLine = coreLine;
			}
		}
	}
	if (nearestLine) {
		const joined = line.words.map((w) => w.word).join("");
		if (nearestLine.original[key].length > 0)
			nearestLine.original[key] += joined;
		else nearestLine.original[key] = joined;
	}
}

const LyricContext: FC = () => {
	const musicId = useAtomValue(musicIdAtom);
	const advanceLyricDynamicLyricTime = useAtomValue(
		advanceLyricDynamicLyricTimeAtom,
	);
	const setLyricLines = useSetAtom(musicLyricLinesAtom);
	const setHideLyricView = useSetAtom(hideLyricViewAtom);
	const song = useLiveQuery(() => db.songs.get(musicId), [musicId]);

	useEffect(() => {
		if (song) {
			try {
				let parsedLyricLines: LyricLine[] = [];
				switch (song.lyricFormat) {
					case "lrc": {
						parsedLyricLines = parseLrc(song.lyric);
						console.log("解析出 LyRiC 歌词", parsedLyricLines);
						break;
					}
					case "eslrc": {
						parsedLyricLines = parseEslrc(song.lyric);
						console.log("解析出 ESLyRiC 歌词", parsedLyricLines);
						break;
					}
					case "yrc": {
						parsedLyricLines = parseYrc(song.lyric);
						console.log("解析出 YRC 歌词", parsedLyricLines);
						break;
					}
					case "qrc": {
						parsedLyricLines = parseQrc(song.lyric);
						console.log("解析出 QRC 歌词", parsedLyricLines);
						break;
					}
					case "lys": {
						parsedLyricLines = parseLys(song.lyric);
						console.log("解析出 Lyricify Syllable 歌词", parsedLyricLines);
						break;
					}
					case "ttml": {
						parsedLyricLines = parseTTML(song.lyric).lines;
						console.log("解析出 TTML 歌词", parsedLyricLines);
						break;
					}
					default: {
						setLyricLines([]);
						setHideLyricView(true);
						return;
					}
				}
				if (song.translatedLrc) {
					try {
						const translatedLyricLines = parseLrc(song.translatedLrc);
						for (const line of translatedLyricLines) {
							pairLyric(line, parsedLyricLines, "translatedLyric");
						}
						console.log("已匹配翻译歌词");
					} catch (err) {
						console.warn("解析翻译歌词时出现错误", err);
					}
				}
				if (song.romanLrc) {
					try {
						const romanLyricLines = parseLrc(song.romanLrc);
						for (const line of romanLyricLines) {
							pairLyric(line, parsedLyricLines, "romanLyric");
						}
						console.log("已匹配音译歌词");
					} catch (err) {
						console.warn("解析音译歌词时出现错误", err);
					}
				}
				if (advanceLyricDynamicLyricTime) {
					for (const line of parsedLyricLines) {
						line.startTime = Math.max(0, line.startTime - 400);
						line.endTime = Math.max(0, line.endTime - 400);
					}
				}
				setLyricLines(parsedLyricLines);
				setHideLyricView(parsedLyricLines.length === 0);
			} catch (e) {
				console.warn("解析歌词时出现错误", e);
				setLyricLines([]);
				setHideLyricView(true);
			}
		} else {
			setLyricLines([]);
			setHideLyricView(true);
		}
	}, [song, advanceLyricDynamicLyricTime, setLyricLines, setHideLyricView]);

	return null;
};

export const LocalMusicContext: FC = () => {
	const store = useStore();
	const { t } = useTranslation();

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
			onLyricLineClickAtom,
			toEmit((evt) => {
				emitAudioThread("seekAudio", {
					position: evt.line.getLine().startTime / 1000,
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
		store.set(
			onRequestOpenMenuAtom,
			toEmit(() => {
				toast.info(
					t("amll.openMenuViaRightClick", "请右键歌词页任意位置来打开菜单哦！"),
				);
			}),
		);
		store.set(
			onClickLeftFunctionButtonAtom,
			toEmit(() => {
				toast.info(
					t("amll.buttonForDisplayOnly", "此按钮仅供展示用途，暂无实际功能"),
				);
			}),
		);
		store.set(
			onClickRightFunctionButtonAtom,
			toEmit(() => {
				toast.info(
					t("amll.buttonForDisplayOnly", "此按钮仅供展示用途，暂无实际功能"),
				);
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
					store.set(musicNameAtom, song.songName);
					store.set(musicAlbumNameAtom, song.songAlbum);
					store.set(
						musicArtistsAtom,
						song.songArtists.split("/").map((v) => ({
							id: v.trim(),
							name: v.trim(),
						})),
					);

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
					store.set(musicCoverIsVideoAtom, song.cover.type.startsWith("video"));
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
			const LOSSLESS_CODECS = new Set(["flac", "alac"]);
			const codec = quality.codec ?? "unknown";
			if (LOSSLESS_CODECS.has(codec) || codec.startsWith("pcm_")) {
				result = AudioQualityType.Lossless;
				if ((quality.sampleRate || 0) > 48000) {
					result = AudioQualityType.HiRes;
				}
			}
			if ((quality.channels || 0) > 2) {
				result = AudioQualityType.DolbyAtmos;
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
					// toast.error(`播放后端加载音频失败\n${evtData.data.error}`, {});
					toast.error(
						t("amll.loadAudioError", "播放后端加载音频失败\n{error}", {
							error: evtData.data.error,
						}),
						{},
					);
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
	}, [store, t]);

	return (
		<>
			<LyricContext />
			<FFTToLowPassContext />
		</>
	);
};

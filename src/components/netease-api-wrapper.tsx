/**
 * @fileoverview
 * 用于监听网易云的各种事件和回调，并存储到 Atom 中供其他模块使用
 * 做这个的另外一个原因是方便做歌词调试，这样可以设置调试专用的事件回调，无需再打开网易云测试效果了。
 */

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import * as React from "react";
import {
	AudioQualityType,
	genBitmapImage,
	getPlayingSong,
	loadLyric,
	PlayState,
	toPlayState,
} from "../api";
import { grabImageColors as workerGrabImageColors } from "../worker";
import {
	useNowPlayingOpened,
	useConfigValueBoolean,
	useFMOpened,
	useConfigValue,
	useAlbumImage,
} from "../api/react";
import { LyricLine, parseLyric } from "../core/lyric-parser";
import {
	albumImageMainColorsAtom,
	albumImageUrlAtom,
	currentAudioDurationAtom,
	currentAudioIdAtom,
	currentAudioQualityTypeAtom,
	currentLyricsAtom,
	currentLyricsIndexAtom,
	currentRawLyricRespAtom,
	getMusicId,
	lyricOffsetAtom,
	musicIdAtom,
	playingSongDataAtom,
	playProgressAtom,
	playStateAtom,
	playVolumeAtom,
} from "../core/states";
import { error, warn } from "../utils/logger";

export const NCMEnvWrapper: React.FC = () => {
	const [playState, setPlayState] = useAtom(playStateAtom);
	const musicId = useAtomValue(musicIdAtom);
	const curLyricOffset = useAtomValue(lyricOffsetAtom);
	const setPlayProgress = useSetAtom(playProgressAtom);
	const setPlayVolume = useSetAtom(playVolumeAtom);
	const setCurrentAudioDuration = useSetAtom(currentAudioDurationAtom);
	const setCurrentLyricsIndex = useSetAtom(currentLyricsIndexAtom);
	const setCurrentAudioQualityType = useSetAtom(currentAudioQualityTypeAtom);
	const setPlayingSongData = useSetAtom(playingSongDataAtom);
	const setAlbumImageMainColors = useSetAtom(albumImageMainColorsAtom);
	const setAlbumImageUrlAtom = useSetAtom(albumImageUrlAtom);
	const isLyricPageOpening = useNowPlayingOpened();
	const isFMPageOpening = useFMOpened();
	const [currentLyrics, setCurrentLyrics] = useAtom(currentLyricsAtom);
	const [currentAudioId, setCurrentAudioId] = useAtom(currentAudioIdAtom);
	const [albumImageLoaded, albumImage] = useAlbumImage(musicId, 128, 128);

	const configTranslatedLyric = useConfigValueBoolean("translated-lyric", true);
	const configDynamicLyric = useConfigValueBoolean("dynamic-lyric", false);
	const configRomanLyric = useConfigValueBoolean("roman-lyric", true);
	const configGlobalTimeStampOffset = Number(
		useConfigValue("globalTimeStampOffset", "0"),
	);

	const [currentRawLyricResp, setCurrentRawLyricResp] = useAtom(
		currentRawLyricRespAtom,
	);

	React.useLayoutEffect(() => {
		const img = new Image();
		let canceled = false;
		if (albumImageLoaded) {
			setAlbumImageUrlAtom(albumImage.src);
		}
		img.addEventListener(
			"load",
			() => {
				if (!canceled) {
					(async () => {
						const bm = await genBitmapImage(albumImage, 128, 128);
						if (bm) {
							const colors = await workerGrabImageColors(bm, 16);
							setAlbumImageMainColors(colors);
						} else {
							warn("缩放图片失败", albumImage.src);
						}
					})();
				}
			},
			{
				once: true,
			},
		);
		img.addEventListener("error", (evt) => {
			warn("用于更新背景颜色板的图片", albumImage.src, "加载失败：", evt.error);
		});
		img.src = albumImage.src;
		return () => {
			canceled = true;
			setAlbumImageUrlAtom(null);
		};
	}, [albumImageLoaded]);

	React.useLayoutEffect(() => {
		if (isLyricPageOpening || isFMPageOpening) {
			let canceled = false;
			(async () => {
				setCurrentLyrics(null);
				try {
					const lyric = await loadLyric(musicId);
					if (!canceled) {
						setCurrentRawLyricResp(lyric);
					}
				} catch (err) {
					error(err);
				}
			})();
			return () => {
				canceled = true;
				setCurrentLyrics(null);
			};
		}
	}, [musicId, isLyricPageOpening, isFMPageOpening]);

	React.useLayoutEffect(() => {
		const bitrate: number | undefined =
			getPlayingSong()?.from?.lastPlayInfo?.bitrate;
		const envSound: string | undefined =
			getPlayingSong()?.from?.lastPlayInfo?.envSound;
		if (envSound === "dolby") {
			setCurrentAudioQualityType(AudioQualityType.DolbyAtmos);
		} else if (bitrate === undefined) {
			setCurrentAudioQualityType(AudioQualityType.Local);
		} else if (bitrate <= 192) {
			setCurrentAudioQualityType(AudioQualityType.Normal);
		} else if (bitrate <= 320) {
			setCurrentAudioQualityType(AudioQualityType.High);
		} else if (bitrate <= 999) {
			setCurrentAudioQualityType(AudioQualityType.Lossless);
		} else if (bitrate <= 1999) {
			setCurrentAudioQualityType(AudioQualityType.HiRes);
		}
	}, [currentAudioId]);

	React.useLayoutEffect(() => {
		let parsed: LyricLine[] = [];
		let canUseDynamicLyric = !(
			!currentRawLyricResp?.yrc?.lyric ||
			(configTranslatedLyric &&
				(currentRawLyricResp?.tlyric?.lyric?.length ?? 0) > 0 &&
				!currentRawLyricResp.ytlrc) ||
			(configRomanLyric &&
				(currentRawLyricResp?.romalrc?.lyric?.length ?? 0) > 0 &&
				!currentRawLyricResp.yromalrc)
		);
		if (configDynamicLyric && canUseDynamicLyric) {
			parsed = parseLyric(
				currentRawLyricResp?.yrc?.lyric || "",
				currentRawLyricResp?.ytlrc?.lyric || "",
				currentRawLyricResp?.yromalrc?.lyric || "",
				currentRawLyricResp?.yrc?.lyric || "",
			);
		} else {
			parsed = parseLyric(
				currentRawLyricResp?.lrc?.lyric || "",
				currentRawLyricResp?.tlyric?.lyric || "",
				currentRawLyricResp?.romalrc?.lyric || "",
				"",
			);
		}
		// log(currentRawLyricResp, parsed);
		setCurrentLyrics(parsed);
		setCurrentLyricsIndex(-1);
	}, [
		currentRawLyricResp,
		configDynamicLyric,
		configRomanLyric,
		configTranslatedLyric,
	]);

	React.useLayoutEffect(() => {
		setPlayState(toPlayState(getPlayingSong().state));
	}, [isLyricPageOpening]);

	React.useLayoutEffect(() => {
		setPlayingSongData(getPlayingSong());

		const onVolumeChanged = (
			_audioId: string,
			_unknownArg0: number,
			_unknownArg1: number,
			volume: number, // [0.0-1.0]
		) => {
			setPlayVolume(volume);
		};

		legacyNativeCmder.appendRegisterCall(
			"Volume",
			"audioplayer",
			onVolumeChanged,
		);
		// legacyNativeCmder._envAdapter.callAdapter("audioplayer.setVolume", () => {}, [])
		try {
			const nmSettings = JSON.parse(
				localStorage.getItem("NM_SETTING_PLAYER") ?? "{}",
			);
			setPlayVolume(nmSettings?.volume ?? 0.5);
		} catch {}

		let duration = 0;

		try {
			duration = getPlayingSong()?.data?.duration || 0;
			setCurrentAudioDuration(duration);
		} catch {}

		try {
			const nmSettings = JSON.parse(
				localStorage.getItem("NM_SETTING_USER") ?? "{}",
			);
			setPlayState(
				nmSettings?.pauseStatus ? PlayState.Pausing : PlayState.Playing,
			);
			setPlayProgress(
				(((nmSettings?.lastPlaying?.playPostion || 0) * duration) / 1000) | 0,
			);
		} catch {}

		return () => {
			legacyNativeCmder.removeRegisterCall(
				"Volume",
				"audioplayer",
				onVolumeChanged,
			);
		};
	}, []);

	React.useLayoutEffect(() => {
		let tweenId = 0;
		let onIntervalGettingSongData = 0;
		const setIntervalGetSongData = () => {
			onIntervalGettingSongData = setInterval(() => {
				setCurrentAudioId(getMusicId().toString());
				setPlayingSongData(getPlayingSong());
			}, 200);
		};

		const onPlayProgress = (
			audioId: string,
			progress: number,
			loadProgress: number, // 当前音乐加载进度 [0.0-1.0] 1 为加载完成
			isTween = false,
		) => {
			setPlayProgress(progress);
			progress += configGlobalTimeStampOffset; // 全局位移
			progress += curLyricOffset; // 当前歌曲位移
			if (playState === PlayState.Playing && APP_CONF.isOSX && !isTween) {
				// 因为 Mac 版本的网易云的播放进度回调是半秒一次，所以完全不够用
				// 我们自己要做一个时间补偿
				let originalProgress = progress;
				const curTweenId = tweenId++;
				const tweenPlayProgress = (delta: number) => {
					if (playState === PlayState.Playing && curTweenId === tweenId) {
						originalProgress += delta / 1000;
						onPlayProgress(audioId, originalProgress, loadProgress, true);
						requestAnimationFrame(tweenPlayProgress);
					}
				};
				requestAnimationFrame(tweenPlayProgress);
			}
			// setPlayState(toPlayState(getPlayingSong().state));
			clearInterval(onIntervalGettingSongData);
			setCurrentAudioId(audioId);
			const time = (progress * 1000) | 0;
			let curLyricIndex: number | null = null;
			if (currentLyrics) {
				for (let i = currentLyrics.length - 1; i >= 0; i--) {
					if (
						time >
						(currentLyrics[i]?.dynamicLyricTime || currentLyrics[i]?.time)
					) {
						curLyricIndex = i;
						break;
					}
				}
				if (
					curLyricIndex !== null &&
					time <
						currentLyrics[curLyricIndex].time +
							Math.max(0, currentLyrics[curLyricIndex].duration - 100)
				) {
					// log("回调已设置歌词位置为", curLyricIndex);
					setCurrentLyricsIndex(curLyricIndex);
				} else if (
					currentLyrics[currentLyrics.length - 1] &&
					time >
						(currentLyrics[currentLyrics.length - 1]?.dynamicLyricTime ||
							currentLyrics[currentLyrics.length - 1].time) +
							currentLyrics[currentLyrics.length - 1].duration +
							750
				) {
					// log("回调已设置歌词位置为", currentLyrics.length);
					setCurrentLyricsIndex(currentLyrics.length);
				}
			}
		};

		const onPlayStateChange = (
			audioId: string,
			stateId: string,
			_loadProgress: PlayState,
		) => {
			const state = stateId.split("|")[1];
			setCurrentAudioId(audioId);
			if (state === "pause") {
				setPlayState(PlayState.Pausing);
			} else if (state === "resume") {
				setPlayState(PlayState.Playing);
			}
		};

		interface AudioLoadInfo {
			activeCode: number;
			code: number;
			duration: number; // 单位秒
			errorCode: number;
			errorString: number;
		}

		interface AudioEndInfo {
			code: number;
			from: string; // switch
		}

		const onLoad = (audioId: string, info: AudioLoadInfo) => {
			setCurrentAudioDuration(((info?.duration || 0) * 1000) | 0);
			setCurrentAudioId(audioId);
			setPlayingSongData(getPlayingSong());
			setPlayState(toPlayState(getPlayingSong().state));
			clearInterval(onIntervalGettingSongData);
		};

		const onEnd = (audioId: string, _info: AudioEndInfo) => {
			setCurrentAudioId(audioId);
			setPlayingSongData(getPlayingSong());
			setPlayState(toPlayState(getPlayingSong().state));
			setIntervalGetSongData();
		};

		setIntervalGetSongData();
		legacyNativeCmder.appendRegisterCall(
			"PlayProgress",
			"audioplayer",
			onPlayProgress,
		);
		legacyNativeCmder.appendRegisterCall(
			"PlayState",
			"audioplayer",
			onPlayStateChange,
		);
		legacyNativeCmder.appendRegisterCall("Load", "audioplayer", onLoad);
		legacyNativeCmder.appendRegisterCall("End", "audioplayer", onEnd);

		// log("歌词页面已打开，已挂载进度事件");
		return () => {
			legacyNativeCmder.removeRegisterCall(
				"PlayProgress",
				"audioplayer",
				onPlayProgress,
			);
			legacyNativeCmder.removeRegisterCall(
				"PlayState",
				"audioplayer",
				onPlayStateChange,
			);
			legacyNativeCmder.removeRegisterCall("Load", "audioplayer", onLoad);
			legacyNativeCmder.removeRegisterCall("End", "audioplayer", onEnd);
			clearInterval(onIntervalGettingSongData);
			// log("进度事件已解除挂载");
		};
	}, [currentLyrics, playState, configGlobalTimeStampOffset, curLyricOffset]);

	return <></>;
};

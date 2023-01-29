/**
 * @fileoverview
 * 用于监听网易云的各种事件和回调，并存储到 Atom 中供其他模块使用
 * 做这个的另外一个原因是方便做歌词调试，这样可以设置调试专用的事件回调，无需再打开网易云测试效果了。
 */

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import * as React from "react";
import { getPlayingSong, loadLyric, PlayState, toPlayState } from "../api";
import { useNowPlayingOpened, useConfigValueBoolean, useFMOpened } from "../api/react";
import { LyricLine, parseLyric } from "../core/lyric-parser";
import {
	currentAudioDurationAtom,
	currentAudioIdAtom,
	currentLyricsAtom,
	currentLyricsIndexAtom,
	currentRawLyricRespAtom,
	getMusicId,
	musicIdAtom,
	playingSongDataAtom,
	playStateAtom,
} from "../core/states";
import { error, log } from "../utils/logger";

export const NCMEnvWrapper: React.FC = () => {
	const [playState, setPlayState] = useAtom(playStateAtom);
	const musicId = useAtomValue(musicIdAtom);
	const setCurrentAudioId = useSetAtom(currentAudioIdAtom);
	const setCurrentAudioDuration = useSetAtom(currentAudioDurationAtom);
	const setCurrentLyricsIndex = useSetAtom(currentLyricsIndexAtom);
	const setPlayingSongData = useSetAtom(playingSongDataAtom);
	const isLyricPageOpening = useNowPlayingOpened();
	const isFMPageOpening = useFMOpened();
	const [currentLyrics, setCurrentLyrics] = useAtom(currentLyricsAtom);

	const configTranslatedLyric = useConfigValueBoolean("translated-lyric", true);
	const configDynamicLyric = useConfigValueBoolean("dynamic-lyric", false);
	const configRomanLyric = useConfigValueBoolean("roman-lyric", true);

	const [currentRawLyricResp, setCurrentRawLyricResp] = useAtom(
		currentRawLyricRespAtom,
	);

	React.useEffect(() => {
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

	React.useEffect(() => {
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
		log(currentRawLyricResp, parsed);
		setCurrentLyrics(parsed);
		setCurrentLyricsIndex(-1);
	}, [
		currentRawLyricResp,
		configDynamicLyric,
		configRomanLyric,
		configTranslatedLyric,
	]);

	React.useEffect(() => {
		setPlayState(getPlayingSong().state);
	}, [isLyricPageOpening]);

	React.useEffect(() => {
		log("当前播放状态", playState);
	}, [playState]);

	React.useEffect(() => {
		let tweenId = 0;
		const onPlayProgress = (
			audioId: string,
			progress: number,
			loadProgress: number, // 当前音乐加载进度 [0.0-1.0] 1 为加载完成
			isTween = false,
		) => {
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
			setPlayState(toPlayState(getPlayingSong().state));
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
			loadProgress: PlayState,
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
		};

		const onEnd = (audioId: string, _info: AudioEndInfo) => {
			setCurrentAudioId(audioId);
			setPlayingSongData(getPlayingSong());
			setPlayState(toPlayState(getPlayingSong().state));
			setTimeout(() => {
				setCurrentAudioId(getMusicId().toString());
				setPlayingSongData(getPlayingSong());
			}, 200);
		};

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

		log("歌词页面已打开，已挂载进度事件");
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
			log("进度事件已解除挂载");
		};
	}, [currentLyrics, playState]);

	return <></>;
};

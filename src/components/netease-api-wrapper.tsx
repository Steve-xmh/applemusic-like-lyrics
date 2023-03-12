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
	loadTTMLLyric,
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
	currentLyricsIndexesAtom,
	currentPlayModeAtom,
	currentRawLyricRespAtom,
	getMusicId,
	lyricEditorConnectedAtom,
	lyricOffsetAtom,
	musicIdAtom,
	playingSongDataAtom,
	playProgressAtom,
	playStateAtom,
	playVolumeAtom,
	ttmlLyricAtom,
} from "../core/states";
import { error, log, warn } from "../utils/logger";
import { LyricEditorWSClient } from "../core/editor-client";
import { eqSet, getCurrentPlayMode, PlayMode } from "../utils";

export const NCMEnvWrapper: React.FC = () => {
	const [playState, setPlayState] = useAtom(playStateAtom);
	const musicId = useAtomValue(musicIdAtom);
	const curLyricOffset = useAtomValue(lyricOffsetAtom);
	const setPlayProgress = useSetAtom(playProgressAtom);
	const setPlayVolume = useSetAtom(playVolumeAtom);
	const setCurrentAudioDuration = useSetAtom(currentAudioDurationAtom);
	const setCurrentLyricsIndexes = useSetAtom(currentLyricsIndexesAtom);
	const setCurrentAudioQualityType = useSetAtom(currentAudioQualityTypeAtom);
	const setLyricEditorConnected = useSetAtom(lyricEditorConnectedAtom);
	const setPlayingSongData = useSetAtom(playingSongDataAtom);
	const setAlbumImageMainColors = useSetAtom(albumImageMainColorsAtom);
	const setAlbumImageUrl = useSetAtom(albumImageUrlAtom);
	const setCurrentPlayMode = useSetAtom(currentPlayModeAtom);
	const isLyricPageOpening = useNowPlayingOpened();
	const isFMPageOpening = useFMOpened();
	const [currentLyrics, setCurrentLyrics] = useAtom(currentLyricsAtom);
	const [currentAudioId, setCurrentAudioId] = useAtom(currentAudioIdAtom);
	const [albumImageLoaded, albumImage] = useAlbumImage(musicId, 128, 128);

	const configTranslatedLyric = useConfigValueBoolean("translated-lyric", true);
	const configDynamicLyric = useConfigValueBoolean("dynamic-lyric", false);
	const configRomanLyric = useConfigValueBoolean("roman-lyric", true);
	const configTTMLLyric = useConfigValueBoolean("ttml-lyric", false);
	const enableEditor = useConfigValueBoolean("enableEditor", false);
	const configGlobalTimeStampOffset = Number(
		useConfigValue("globalTimeStampOffset", "0"),
	);

	const [currentRawLyricResp, setCurrentRawLyricResp] = useAtom(
		currentRawLyricRespAtom,
	);
	const [ttmlLyric, setTTMLLyric] = useAtom(ttmlLyricAtom);

	const [reconnectCounter, setReconnectCounter] = React.useState(Symbol());
	const editorWSClient = React.useRef<LyricEditorWSClient>();
	React.useEffect(() => {
		if (enableEditor) {
			let client = new LyricEditorWSClient();
			log("正在连接到歌词编辑器！", client.url);

			client.addEventListener("message", (msg) => {
				log("歌词编辑器返回信息！", msg);
			});

			client.addEventListener("open", () => {
				log("歌词编辑器已连接！");
				setLyricEditorConnected(true);
			});

			client.addEventListener("error", (msg) => {
				warn("歌词编辑器连接出错：", msg);
				setReconnectCounter(Symbol());
			});

			client.addEventListener("close", () => {
				log("歌词编辑器已断开连接！");
				setReconnectCounter(Symbol());
			});

			editorWSClient.current = client;

			return () => {
				log("歌词编辑器接口已关闭！");
				client.dispose();
				setLyricEditorConnected(false);
				editorWSClient.current = undefined;
			};
		}
	}, [reconnectCounter, enableEditor]);

	React.useLayoutEffect(() => {
		const img = new Image();
		let canceled = false;
		if (albumImageLoaded) {
			setAlbumImageUrl(albumImage.src);
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
			setAlbumImageUrl(null);
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
			(async () => {
				setTTMLLyric(null);
				// setTTMLLyric
				try {
					const lyric = await loadTTMLLyric(musicId);
					if (!canceled) {
						setTTMLLyric(lyric);
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
		if (configTTMLLyric && ttmlLyric) {
			log("存在 TTML 歌词，正在替换", ttmlLyric);
			setCurrentLyrics(ttmlLyric);
			setCurrentLyricsIndexes(new Set());
			return;
		}
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
		setCurrentLyrics(parsed);
		setCurrentLyricsIndexes(new Set());
	}, [
		currentRawLyricResp,
		configDynamicLyric,
		configRomanLyric,
		configTranslatedLyric,
		configTTMLLyric,
		ttmlLyric,
	]);

	React.useEffect(() => {
		const client = editorWSClient.current;

		if (client) {
			const onMessage = (msg: MessageEvent) => {
				if (msg.data.type === "pullLyric") {
					editorWSClient.current?.send(
						JSON.stringify({
							type: "updateLyric",
							value:
								currentLyrics?.map((v) => [
									v.originalLyric,
									v.translatedLyric,
									v.romanLyric,
								]) ?? [],
						}),
					);
				}
			};

			client.addEventListener("data", onMessage);

			return () => {
				client.removeEventListener("data", onMessage);
			};
		}
	}, [reconnectCounter, currentLyrics]);

	React.useEffect(() => {
		const client = editorWSClient.current;

		if (client) {
			const onMessage = (msg: MessageEvent) => {
				if (msg.data.type === "pullMusicID") {
					editorWSClient.current?.send(
						JSON.stringify({
							type: "updateMusicID",
							value: String(musicId),
						}),
					);
				}
			};

			client.addEventListener("data", onMessage);

			return () => {
				client.removeEventListener("data", onMessage);
			};
		}
	}, [reconnectCounter, musicId]);

	React.useLayoutEffect(() => {
		setPlayState(toPlayState(getPlayingSong().state));
		setCurrentPlayMode(getCurrentPlayMode() || PlayMode.One);
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

		let lastIndexes = new Set<number>();

		const onPlayProgress = (
			audioId: string,
			progress: number,
			loadProgress: number, // 当前音乐加载进度 [0.0-1.0] 1 为加载完成
			isTween = false,
		) => {
			editorWSClient.current?.send(
				`{\"type\":\"syncTime\",\"value\":[${
					(progress * 1000) | 0
				},${Date.now()}]}`,
			);
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
				const lastLine = currentLyrics[currentLyrics.length - 1];
				const indexes = new Set<number>();
				currentLyrics.forEach((line, index) => {
					const beginTime = line.dynamicLyricTime ?? line.beginTime ?? 0;
					const endTime = beginTime + line.duration;
					if (time > beginTime && time < endTime) {
						indexes.add(index);
					}
				});
				for (let i = currentLyrics.length - 1; i >= 0; i--) {
					if (
						time >
						(currentLyrics[i].dynamicLyricTime ??
							currentLyrics[i].beginTime ??
							0)
					) {
						curLyricIndex = i;
						break;
					}
				}
				if (curLyricIndex !== null) {
					const curLyricLine = currentLyrics[curLyricIndex];
					if (
						configDynamicLyric &&
						curLyricLine.dynamicLyric &&
						curLyricLine.dynamicLyricTime
					) {
						if (
							time <
							curLyricLine.dynamicLyricTime +
								Math.max(0, currentLyrics[curLyricIndex].duration - 100)
						) {
							if (!eqSet(lastIndexes, indexes)) {
								lastIndexes = indexes;
								setCurrentLyricsIndexes(indexes);
							}
						} else if (
							lastLine === curLyricLine &&
							time > curLyricLine.dynamicLyricTime + curLyricLine.duration + 750
						) {
							const s = new Set([currentLyrics.length]);
							if (!eqSet(lastIndexes, s)) {
								lastIndexes = s;
								setCurrentLyricsIndexes(s);
							}
						}
					} else if (
						time <
							currentLyrics[curLyricIndex].beginTime +
								Math.max(0, currentLyrics[curLyricIndex].duration - 100) ||
						curLyricIndex === currentLyrics.length - 1
					) {
						if (!eqSet(lastIndexes, indexes)) {
							lastIndexes = indexes;
							setCurrentLyricsIndexes(indexes);
						}
					}
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

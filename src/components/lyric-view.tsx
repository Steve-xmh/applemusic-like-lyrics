import {
	classname,
	genAudioPlayerCommand,
	getLyric,
	getNCMImageUrl,
	getPlayingSong,
	getSongDetail,
	PlayState,
	SongDetailResponse,
} from "../api";
import {
	useAlbumImageUrl,
	useConfig,
	useFMOpened,
	useForceUpdate,
	useNowPlayingOpened,
} from "../react-api";
import { ThemeProvider } from "..";
import { log, warn } from "../logger";
import { LyricDots } from "./lyric-dots";
import {
	LyricLine,
	parseLyric,
	PURE_MUSIC_LYRIC_DATA,
	PURE_MUSIC_LYRIC_LINE,
} from "../lyric-parser";
import { Tween, Easing } from "../tweenjs";
import * as React from "react";
import { GLOBAL_EVENTS } from "../global-events";
import {
	Loader,
	Center,
	Text,
	Button,
	LoadingOverlay,
	Space,
	Modal,
	NumberInput,
	FileInput,
	Card,
	Image,
	Flex,
	Box,
	ActionIcon,
} from "@mantine/core";
import { useDebouncedState } from "@mantine/hooks";
import { LyricBackground } from "./lyric-background";
import { LyricLineView } from "./lyric-line";
import { guessTextReadDuration } from "../utils";
import {
	IconDots,
	IconHeart,
	IconHeartBroken,
	IconPlayerPlay,
	IconPlayerSkipBack,
	IconPlayerSkipForward,
	IconTrash,
} from "@tabler/icons";

const loadLyric = async (id: string | number) => {
	const lyricsPath = `${plugin.pluginPath}/lyrics`;
	const cachedLyricPath = `${lyricsPath}/${id}.json`;
	try {
		if (await betterncm.fs.exists(cachedLyricPath)) {
			const cachedLyricData = await betterncm.fs.readFileText(cachedLyricPath);
			return JSON.parse(cachedLyricData);
		}
	} catch (err) {
		warn("警告：加载已缓存歌词失败", err);
	}
	if (typeof id === "number") {
		const data = await getLyric(id);
		try {
			if (!(await betterncm.fs.exists(lyricsPath))) {
				betterncm.fs.mkdir(lyricsPath);
			}
			await betterncm.fs.writeFile(
				cachedLyricPath,
				JSON.stringify(data, null, 4),
			);
		} catch (err) {
			warn("警告：缓存歌词失败", err);
		}
		return data;
	} else {
		// 如果是摘要字符串的话，那就是本地文件
		return {};
	}
};

const SongView: React.FC<{ id?: number }> = (props) => {
	const [songRes, setSongRes] = React.useState<SongDetailResponse>();
	const songInfo = React.useMemo(
		() => (songRes === undefined ? undefined : songRes?.songs[0] || null),
		[songRes],
	);
	React.useEffect(() => {
		setSongRes(undefined);
		let canceled = false;
		(async () => {
			if (props.id) {
				const info = await getSongDetail(props.id);
				if (!canceled) {
					setSongRes(info);
				}
			}
		})();
		return () => {
			canceled = true;
		};
	}, [props.id]);

	return (
		<Card>
			<Flex
				justify="flex-start"
				align={songInfo ? "flex-start" : "center"}
				direction="row"
				wrap="nowrap"
				gap="md"
			>
				<Image
					src={
						songInfo
							? songInfo.al.picUrl
							: `orpheus://cache/?${getNCMImageUrl("16601526067802346")}`
					}
					radius="md"
					height={64}
					width={64}
				/>
				<Box>
					<Text size="md">
						{props.id
							? songInfo === undefined
								? "正在加载"
								: songInfo === null
								? "无此歌曲"
								: songInfo.name
							: "未知音乐"}
					</Text>
					<Text lineClamp={1}>
						{props.id
							? songInfo
								? songInfo.ar.map((v) => v.name).join(" / ")
								: ""
							: "未知歌手"}
					</Text>
					<Text lineClamp={1}>
						{props.id ? (songInfo ? songInfo.al.name : "") : "未知专辑"}
					</Text>
				</Box>
			</Flex>
		</Card>
	);
};

const getMusicId = (): number =>
	getPlayingSong()?.originFromTrack?.lrcid ||
	getPlayingSong()?.originFromTrack?.track?.tid ||
	getPlayingSong()?.data?.id ||
	0;

export const LyricView: React.FC<{
	isFM?: boolean;
}> = (props) => {
	const isNowPlayingOpened = useNowPlayingOpened();
	const isFMOpened = useFMOpened();
	const isLyricPageOpening = React.useMemo(() => {
		const o = props.isFM ? isFMOpened : isNowPlayingOpened;
		log("是否打开", props.isFM, o);
		return o;
	}, [props.isFM, isNowPlayingOpened, isFMOpened]);
	const [currentAudioId, setCurrentAudioId] = React.useState("");
	const [currentAudioDuration, setAudioDuration] = React.useState(0);
	const [error, setError] = React.useState<Error | null>(null);
	const [playState, setPlayState] = React.useState<PlayState>(() => {
		log("当前播放状态", getPlayingSong().state);
		return getPlayingSong().state;
	});
	const [currentLyrics, setCurrentLyrics] = React.useState<LyricLine[] | null>(
		null,
	);

	const musicId: number | string = React.useMemo(
		() => getMusicId(),
		[currentAudioId, isLyricPageOpening],
	);
	const album = React.useMemo(
		() => getPlayingSong()?.data?.album || {},
		[musicId],
	);
	const songName: string = React.useMemo(
		() => getPlayingSong()?.data?.name || "未知歌名",
		[musicId],
	);
	const songAliasName: string[] = React.useMemo(
		() => getPlayingSong()?.data?.alias || [],
		[musicId],
	);
	const songArtists = React.useMemo(
		() => getPlayingSong()?.data?.artists || [],
		[musicId],
	);

	const albumImageUrl = useAlbumImageUrl(musicId, 64, 64);

	const [currentLyricIndex, setCurrentLyricIndex] = React.useState<number>(-1);
	const lyricListElement = React.useRef<HTMLDivElement>(null);
	const keepSelectLyrics = React.useRef<Set<number>>(new Set());
	const [_, forceUpdate] = useForceUpdate();

	const [configTranslatedLyric, setConfigTranslatedLyric] = useConfig(
		"translated-lyric",
		"true",
	);
	const [configDynamicLyric, setConfigDynamicLyric] = useConfig(
		"dynamic-lyric",
		"false",
	);
	const [configRomanLyric, setConfigRomanLyric] = useConfig(
		"roman-lyric",
		"true",
	);
	const [alignTopSelectedLyric] = useConfig("alignTopSelectedLyric", "false");
	const [fullscreen, setFullscreen] = React.useState(
		document.webkitIsFullScreen as boolean,
	);

	React.useEffect(() => {
		if (document.webkitIsFullScreen !== fullscreen) {
			if (fullscreen) {
				document.body.webkitRequestFullScreen(Element["ALLOW_KEYBOARD_INPUT"]);
			} else {
				document.exitFullscreen();
			}
		}
	}, [fullscreen]);

	const scrollDelayRef = React.useRef(0);

	React.useEffect(() => {
		setPlayState(getPlayingSong().state);
		const onFullscreenChanged = () => {
			setFullscreen(document.webkitIsFullScreen as boolean);
		};
		document.addEventListener("fullscreenchange", onFullscreenChanged);
		return () => {
			document.removeEventListener("fullscreenchange", onFullscreenChanged);
		};
	}, []);

	const onLyricScroll = (evt: Event) => {
		scrollDelayRef.current = Date.now();
		log("滚动事件", evt);
	};

	const loadLyric = React.useCallback(async (id: string | number) => {
		const lyricsPath = `${plugin.pluginPath}/lyrics`;
		const cachedLyricPath = `${lyricsPath}/${id}.json`;
		try {
			if (await betterncm.fs.exists(cachedLyricPath)) {
				const cachedLyricData = await betterncm.fs.readFileText(
					cachedLyricPath,
				);
				return JSON.parse(cachedLyricData);
			}
		} catch (err) {
			warn("警告：加载已缓存歌词失败", err);
		}
		if (typeof id === "number") {
			const data = await getLyric(id);
			try {
				if (!(await betterncm.fs.exists(lyricsPath))) {
					betterncm.fs.mkdir(lyricsPath);
				}
				await betterncm.fs.writeFile(
					cachedLyricPath,
					JSON.stringify(data, null, 4),
				);
			} catch (err) {
				warn("警告：缓存歌词失败", err);
			}
			return data;
		} else {
			// 如果是摘要字符串的话，那就是本地文件
			return {};
		}
	}, []);

	const [selectMusicIdModalOpened, setSelectMusicIdModalOpened] =
		React.useState(false);

	const [selectMusicIdModalLoading, setSelectMusicIdModalLoading] =
		React.useState(false);

	const [selectLocalLyricModalOpened, setLocalLyricModalOpened] =
		React.useState(false);

	const [selectLocalLyricModalLoading, setLocalLyricModalLoading] =
		React.useState(false);

	const reloadLyricByCurrentAudioId = React.useCallback(async () => {
		setError(null);
		setCurrentLyrics(null);
		try {
			const lyric = await loadLyric(musicId);
			log("已获取到歌词", lyric);
			const parsed = parseLyric(
				lyric?.lrc?.lyric || "",
				(lyric?.yrc?.lyric
					? lyric?.ytlrc?.lyric || lyric?.tlyric?.lyric
					: lyric?.tlyric?.lyric) || "",
				(lyric?.yrc?.lyric
					? lyric?.yromalrc?.lyric || lyric?.romalrc?.lyric
					: lyric?.romalrc?.lyric) || "",
				lyric?.yrc?.lyric || "",
			);
			log(lyric, parsed);
			scrollDelayRef.current = 0;
			setCurrentLyrics(parsed);
			setCurrentLyricIndex(-1);
			keepSelectLyrics.current.clear();
		} catch (err) {
			setError(err);
		}
	}, [musicId]);

	React.useEffect(() => {
		if (isLyricPageOpening) {
			setSelectMusicIdModalOpened(false);
			setLocalLyricModalOpened(false);
			let canceled = false;
			(async () => {
				setError(null);
				setCurrentLyrics(null);
				try {
					const lyric = await loadLyric(musicId);
					log("已获取到歌词", lyric);
					const parsed = parseLyric(
						lyric?.lrc?.lyric || "",
						(lyric?.yrc?.lyric
							? lyric?.ytlrc?.lyric || lyric?.tlyric?.lyric
							: lyric?.tlyric?.lyric) || "",
						(lyric?.yrc?.lyric
							? lyric?.yromalrc?.lyric || lyric?.romalrc?.lyric
							: lyric?.romalrc?.lyric) || "",
						lyric?.yrc?.lyric || "",
					);
					log(lyric, parsed);
					if (!canceled) {
						scrollDelayRef.current = 0;
						setCurrentLyrics(parsed);
						setCurrentLyricIndex(-1);
						keepSelectLyrics.current.clear();
					}
				} catch (err) {
					setError(err);
				}
			})();
			return () => {
				canceled = true;
				// 滚动到顶部
				lyricListElement.current?.parentElement?.scrollTo(0, 0);
				// 载入新歌词
				setCurrentLyrics(null);
			};
		}
	}, [musicId, isLyricPageOpening]);

	const scrollTween = React.useRef<
		| {
				lyricElement: Element;
				tween: Tween<{ scrollTop: number }>;
		  }
		| undefined
	>(undefined);
	const forceScrollId = React.useRef(0);
	const scrollToLyric = React.useCallback(
		(mustScroll: boolean = false) => {
			if (lyricListElement.current) {
				const lyricView = lyricListElement.current.parentElement;
				let scrollToIndex = currentLyricIndex;
				for (const i of keepSelectLyrics.current) {
					if (scrollToIndex > i) {
						scrollToIndex = i;
					}
				}
				let lyricElement: HTMLElement | null =
					lyricListElement.current.children.item(scrollToIndex) as HTMLElement;
				if (lyricElement && lyricView) {
					// log(lyricElement, scrollTween.current?.lyricElement);
					if (mustScroll) {
						scrollTween.current = undefined;
					}
					if (lyricElement !== scrollTween.current?.lyricElement) {
						const listRect = lyricView.getBoundingClientRect();
						const lineRect = lyricElement.getBoundingClientRect();
						const lineHeight = lineRect.height;
						let scrollDelta = lineRect.top - listRect.top;
						if (alignTopSelectedLyric !== "true") {
							scrollDelta -=
								(window.innerHeight - lineHeight) / 2 - listRect.top;
						} else if (lyricElement.innerText.trim().length > 0) {
							scrollDelta -= listRect.height * 0.1;
						} else {
							scrollDelta -= window.innerHeight * 0.06 + listRect.height * 0.1;
						}
						const prevScrollTop = lyricView.scrollTop;
						const obj = { scrollTop: prevScrollTop };

						if (mustScroll) {
							const id = ++forceScrollId.current;
							const onFrame = () => {
								if (
									lyricElement &&
									!scrollTween.current &&
									id === forceScrollId.current
								) {
									const listRect = lyricView.getBoundingClientRect();
									const lineRect = lyricElement.getBoundingClientRect();
									const prevScrollTop = lyricView.scrollTop;
									const lineHeight = lineRect.height;
									let scrollDelta = lineRect.top - listRect.top;
									if (alignTopSelectedLyric !== "true") {
										scrollDelta -=
											(window.innerHeight - lineHeight) / 2 - listRect.top;
									} else if (lyricElement.innerText.trim().length > 0) {
										scrollDelta -= listRect.height * 0.1;
									} else {
										scrollDelta -=
											window.innerHeight * 0.06 + listRect.height * 0.1;
									}
									if (Math.abs(scrollDelta) > 10) {
										lyricView.scrollTo(0, prevScrollTop + scrollDelta);
										requestAnimationFrame(onFrame);
									}
								}
							};

							requestAnimationFrame(onFrame);
						} else {
							const tween = new Tween(obj)
								.to({ scrollTop: prevScrollTop + scrollDelta }, 750)
								.easing(Easing.Cubic.InOut)
								.onUpdate(() => {
									lyricView.scrollTo(0, obj.scrollTop);
								})
								.start();
							const onFrameUpdate = (time: number) => {
								if (scrollTween.current?.tween === tween) {
									scrollTween.current?.tween?.update(time);
									requestAnimationFrame(onFrameUpdate);
								} else {
									// log("动画被替换，旧动画已停止");
									scrollTween.current?.tween?.stop();
								}
							};
							scrollTween.current = {
								lyricElement,
								tween,
							};
							requestAnimationFrame(onFrameUpdate);
						}
					} else {
						// log("触发相同动画播放");
					}
				} else {
				}
			}
		},
		[currentLyricIndex, alignTopSelectedLyric],
	);

	const onSeekToLyric = React.useCallback(
		(line: LyricLine) => {
			scrollDelayRef.current = 0;
			if (currentLyrics) {
				const index = currentLyrics.findIndex((v) => v === line);
				keepSelectLyrics.current.clear();
				setCurrentLyricIndex(index);
			}
			if (
				configDynamicLyric &&
				(line.dynamicLyricTime ||
					currentAudioDuration < currentAudioDuration) &&
				(line.dynamicLyricTime || -1) >= 0
			) {
				log("正在跳转到歌词时间", line?.dynamicLyricTime || line.time);
				channel.call("audioplayer.seek", () => {}, [
					currentAudioId,
					genAudioPlayerCommand(currentAudioId, "seek"),
					(line?.dynamicLyricTime || line.time) / 1000,
				]);
			} else if (line.time < currentAudioDuration && line.time >= 0) {
				log("正在跳转到歌词时间", line.time);
				channel.call("audioplayer.seek", () => {}, [
					currentAudioId,
					genAudioPlayerCommand(currentAudioId, "seek"),
					line.time / 1000,
				]);
			}
		},
		[currentAudioId, configDynamicLyric, currentAudioDuration],
	);

	React.useEffect(() => {
		const btn = document.querySelector("a[data-action='max']");
		const onWindowSizeChanged = () => {
			scrollToLyric(true); // 触发歌词更新重新定位
		};
		const onLyricOpened = () => {
			log("歌词页面被打开！");
			keepSelectLyrics.current.clear();
			keepSelectLyrics.current.add(currentLyricIndex);
			scrollToLyric(true); // 触发歌词更新重新定位
		};

		GLOBAL_EVENTS.addEventListener("lyric-page-open", onLyricOpened);
		btn?.addEventListener("click", onLyricOpened);
		window.addEventListener("resize", onWindowSizeChanged);
		return () => {
			GLOBAL_EVENTS.removeEventListener("lyric-page-open", onLyricOpened);
			btn?.removeEventListener("click", onLyricOpened);
			window.removeEventListener("resize", onWindowSizeChanged);
		};
	}, [scrollToLyric, currentLyricIndex]);

	const lastUpdateTime = React.useRef(Date.now());
	const lastIndex = React.useRef(-1);

	const checkIfTooFast = React.useCallback(
		(currentLyricIndex: number) => {
			const lastLyricIndex = lastIndex.current;
			if (lastLyricIndex === currentLyricIndex || !currentLyrics) {
				return;
			}
			const changeTime = Date.now();
			const lastLine: LyricLine | undefined = currentLyrics[lastLyricIndex];
			const lastLyric = lastLine?.originalLyric || "";
			if (lastLyric.trim().length === 0) {
				keepSelectLyrics.current.clear();
				return;
			}
			// 预估的阅读时间
			const guessedLineReadTime = Math.min(
				2000,
				Math.max(750, guessTextReadDuration(lastLyric)),
			);
			if (
				lastLine &&
				changeTime - lastUpdateTime.current <= guessedLineReadTime
			) {
				if (keepSelectLyrics.current.size < 3) {
					keepSelectLyrics.current.add(lastLyricIndex);
				} else {
					if (keepSelectLyrics.current.size > 0)
						keepSelectLyrics.current.clear();
					lastUpdateTime.current = changeTime;
				}
				forceUpdate();
				keepSelectLyrics.current.add(currentLyricIndex);
			} else {
				lastUpdateTime.current = changeTime;
				if (keepSelectLyrics.current.size > 0) forceUpdate();
				keepSelectLyrics.current.clear();
			}
		},
		[currentLyrics],
	);

	React.useEffect(() => {
		// log("当前歌词已更新", currentLyricIndex);
		return () => {
			lastIndex.current = currentLyricIndex;
		};
	}, [currentLyricIndex]);

	React.useEffect(() => {
		// log(
		// 	"scrollDelayRef.current",
		// 	scrollDelayRef.current,
		// 	"playState",
		// 	playState,
		// );
		if (
			playState === PlayState.Playing &&
			Date.now() - scrollDelayRef.current > 2000
		) {
			checkIfTooFast(currentLyricIndex);
			scrollToLyric();
		} else {
			lastIndex.current = currentLyricIndex;
		}
	}, [
		scrollToLyric,
		checkIfTooFast,
		currentLyrics,
		currentLyricIndex,
		playState,
	]);

	React.useEffect(() => {
		scrollToLyric(true);
	}, [
		configTranslatedLyric,
		configDynamicLyric,
		configRomanLyric,
		currentLyrics,
	]);

	React.useEffect(() => {
		if (isLyricPageOpening) {
			const onPlayProgress = (
				audioId: string,
				progress: number,
				loadProgress: number, // 当前音乐加载进度 [0.0-1.0] 1 为加载完成
			) => {
				const time = (progress * 1000) | 0;
				let curLyricIndex: number | null = null;
				if (currentLyrics) {
					for (let i = currentLyrics.length - 1; i >= 0; i--) {
						if (configDynamicLyric) {
							if (
								time >
								(currentLyrics[i]?.dynamicLyricTime || currentLyrics[i]?.time)
							) {
								curLyricIndex = i;
								break;
							}
						} else {
							if (time > currentLyrics[i]?.time) {
								curLyricIndex = i;
								break;
							}
						}
					}
					if (
						curLyricIndex !== null &&
						time <
							currentLyrics[curLyricIndex].time +
								Math.max(0, currentLyrics[curLyricIndex].duration - 100)
					) {
						// log("回调已设置歌词位置为", curLyricIndex);
						setCurrentLyricIndex(curLyricIndex);
					} else if (
						currentLyrics[currentLyrics.length - 1] &&
						(configDynamicLyric
							? time >
							  (currentLyrics[currentLyrics.length - 1]?.dynamicLyricTime ||
									currentLyrics[currentLyrics.length - 1].time) +
									currentLyrics[currentLyrics.length - 1].duration +
									750
							: time >
							  currentLyrics[currentLyrics.length - 1].time +
									currentLyrics[currentLyrics.length - 1].duration +
									750)
					) {
						// log("回调已设置歌词位置为", currentLyrics.length);
						setCurrentLyricIndex(currentLyrics.length);
					}
				}
			};

			const onPlayStateChange = (
				audioId: string,
				stateId: string,
				loadProgress: PlayState,
			) => {
				const state = stateId.split("|")[1];
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
				setAudioDuration(((info?.duration || 0) * 1000) | 0);
				setCurrentAudioId(audioId);
			};

			const onEnd = (audioId: string, _info: AudioEndInfo) => {
				setCurrentAudioId(audioId);
				setTimeout(() => {
					setCurrentAudioId(getMusicId().toString());
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
			};
		}
	}, [currentLyrics, isLyricPageOpening]);

	const mapCurrentLyrics = React.useCallback(
		(line: LyricLine, index: number, lines: LyricLine[]) => {
			let isTooFast = keepSelectLyrics.current.has(index); // 如果歌词太快，我们就缓和一下
			const offset = index - currentLyricIndex;
			if (line.originalLyric.trim().length > 0) {
				return (
					<LyricLineView
						key={index}
						selected={index === currentLyricIndex || isTooFast}
						line={line}
						translated={configTranslatedLyric === "true"}
						dynamic={configDynamicLyric === "true"}
						roman={configRomanLyric === "true"}
						offset={offset}
						onClickLyric={onSeekToLyric}
					/>
				);
			} else {
				return (
					<LyricDots
						key={index}
						selected={index === currentLyricIndex}
						time={line.time}
						offset={offset}
						duration={line.duration}
					/>
				);
			}
		},
		[
			onSeekToLyric,
			currentLyrics,
			currentLyricIndex,
			configDynamicLyric,
			configTranslatedLyric,
			configRomanLyric,
		],
	);

	React.useEffect(() => {
		if (fullscreen && isLyricPageOpening) {
			if ("RoundCornerNCM" in loadedPlugins) {
				betterncm.app.setRoundedCorner(false);
			}
			document.querySelector(".m-winctrl")?.classList.add("disabled");
		} else {
			if ("RoundCornerNCM" in loadedPlugins) {
				betterncm.app.setRoundedCorner(true);
			}
			document.querySelector(".m-winctrl")?.classList.remove("disabled");
		}
	}, [fullscreen, isLyricPageOpening]);

	React.useEffect(() => {
		() => {
			document.querySelector(".m-winctrl")?.classList.remove("disabled");
		};
	}, []);

	const [showBackground] = useConfig("showBackground", "true");
	const [hideAlbumImage] = useConfig("hideAlbumImage", "false");
	const [hideMusicName] = useConfig("hideMusicName", "false");
	const [hideMusicAlias] = useConfig("hideMusicAlias", "false");
	const [hideMusicArtists] = useConfig("hideMusicArtists", "false");
	const [hideMusicAlbum] = useConfig("hideMusicAlbum", "false");
	const [selectMusicId, setSelectMusicId] = React.useState(0);
	const [originalLyricFile, setOriginalLyricFile] = React.useState<File | null>(
		null,
	);
	const [translatedLyricFile, setTranslatedLyricFile] =
		React.useState<File | null>(null);
	const [romanLyricFile, setRomanLyricFile] = React.useState<File | null>(null);
	const [dynamicLyricFile, setDynamicLyricFile] = React.useState<File | null>(
		null,
	);

	const [likeOrUnlike, setLikeOrUnlike] = React.useState<boolean | null>(
		document.querySelector<HTMLButtonElement>(".m-fm .btn_pc_like")?.dataset
			?.action === "like",
	);

	React.useEffect(() => {
		if (props.isFM) {
			const likeBtn =
				document.querySelector<HTMLButtonElement>(".m-fm .btn_pc_like");
			if (likeBtn) {
				const btnObs = new MutationObserver(() => {
					setLikeOrUnlike(likeBtn?.dataset?.action === "like");
				});
				btnObs.observe(likeBtn, {
					attributes: true,
					attributeFilter: ["data-action"],
				});
				return () => {
					btnObs.disconnect();
				};
			}
		}
	}, [props.isFM]);

	return (
		<ThemeProvider>
			{showBackground === "true" && <LyricBackground musicId={musicId} />}
			{(hideAlbumImage === "false" ||
				hideMusicName === "false" ||
				hideMusicAlias === "false" ||
				hideMusicArtists === "false" ||
				hideMusicAlbum === "false") && (
				<div className="am-music-info">
					<div>
						{hideAlbumImage !== "true" && (
							<div className="am-album-image">
								<div>
									<LoadingOverlay
										loader={
											<Loader
												size={50}
												style={{ width: "50px", height: "50px" }}
											/>
										}
										sx={{
											borderRadius: "5%",
										}}
										visible={albumImageUrl.length === 0}
									/>
									<img
										alt="专辑图片"
										src={albumImageUrl}
										style={{
											opacity: albumImageUrl.length > 0 ? 1 : 0,
										}}
									/>
								</div>
							</div>
						)}
						{hideMusicName !== "true" && (
							<div className="am-music-name">{songName}</div>
						)}
						{hideMusicAlias !== "true" && songAliasName.length > 0 && (
							<div className="am-music-alias">
								{songAliasName.map((alia, index) => (
									// rome-ignore lint/suspicious/noArrayIndexKey: <explanation>
									<div key={index}>{alia}</div>
								))}
							</div>
						)}
						{hideMusicArtists !== "true" && (
							<div className="am-music-artists">
								<div className="am-artists-label">歌手：</div>
								<div className="am-artists">
									{songArtists.map((artist, index) => (
										<a href={`#/m/artist/?id=${artist.id}`} key={artist.id}>
											{artist.name}
										</a>
									))}
								</div>
							</div>
						)}
						{hideMusicAlbum !== "true" && album && (
							<div className="am-music-album">
								<div className="am-album-label">专辑：</div>
								<div className="am-album">
									<a href={`#/m/album/?id=${album?.id}`}>{album.name}</a>
								</div>
							</div>
						)}
						{props.isFM && (
							<div className="am-fm-player-ctl">
								<ActionIcon
									size="xl"
									loading={likeOrUnlike === null}
									onClick={() => {
										setLikeOrUnlike(null);
										document
											.querySelector<HTMLButtonElement>(".m-fm .btn_pc_like")
											?.click();
									}}
								>
									{likeOrUnlike ? (
										<IconHeart size={34} />
									) : (
										<IconHeartBroken size={34} />
									)}
								</ActionIcon>
								<ActionIcon
									size="xl"
									onClick={() => {
										document
											.querySelector<HTMLButtonElement>(
												".m-fm [data-action=hate]",
											)
											?.click();
									}}
								>
									<IconTrash size={34} />
								</ActionIcon>
								<ActionIcon
									size="xl"
									onClick={() => {
										document
											.querySelector<HTMLButtonElement>(
												".m-fm [data-action=next]",
											)
											?.click();
									}}
								>
									<IconPlayerSkipForward size={34} />
								</ActionIcon>
								<ActionIcon
									size="xl"
									onClick={() => {
										document
											.querySelector<HTMLButtonElement>(
												".m-fm [data-action=more]",
											)
											?.click();
									}}
								>
									<IconDots size={34} />
								</ActionIcon>
							</div>
						)}
					</div>
				</div>
			)}
			<div className="am-lyric">
				<div className="am-lyric-options">
					<button
						onClick={() => {
							log("已切换翻译歌词");
							setConfigTranslatedLyric(
								String(!(configTranslatedLyric === "true")),
							);
							forceUpdate();
						}}
						className={classname({
							toggled: configTranslatedLyric === "true",
						})}
						type="button"
					>
						译
					</button>
					<button
						onClick={() => {
							log("已切换音译歌词");
							setConfigRomanLyric(String(!(configRomanLyric === "true")));
							forceUpdate();
						}}
						className={classname({
							toggled: configRomanLyric === "true",
						})}
						type="button"
					>
						音
					</button>
					<button
						onClick={() => {
							log("已切换逐词歌词");
							setConfigDynamicLyric(String(!(configDynamicLyric === "true")));
							forceUpdate();
						}}
						className={classname({
							toggled: configDynamicLyric === "true",
						})}
						type="button"
					>
						逐词歌词（实验性）
					</button>
					<button
						onClick={() => {
							log("已切换全屏模式");
							setFullscreen(!fullscreen);
							scrollToLyric(true);
						}}
						className={classname({
							toggled: fullscreen,
						})}
						type="button"
					>
						全屏
					</button>
				</div>
				{error ? (
					<div className="am-lyric-view-error">
						<div>歌词加载失败：</div>
						<div>{error.message}</div>
						<div>{error.stack}</div>
					</div>
				) : currentLyrics ? (
					currentLyrics.length > 0 ? (
						<div className="am-lyric-view" onWheel={onLyricScroll}>
							<div ref={lyricListElement}>
								{currentLyrics.map(mapCurrentLyrics)}
							</div>
						</div>
					) : (
						<div className="am-lyric-view-no-lyric">
							<Text fz="md">
								没有可用歌词，但是你可以手动指定需要使用的歌词：
							</Text>
							<Space h="xl" />
							<Button.Group orientation="vertical">
								<Button
									variant="outline"
									onClick={() => setSelectMusicIdModalOpened(true)}
								>
									使用指定网易云已有音乐歌词
								</Button>
								<Button
									variant="outline"
									onClick={() => setLocalLyricModalOpened(true)}
								>
									使用本地歌词文件
								</Button>
								<Button
									variant="outline"
									onClick={async () => {
										const lyricsPath = `${plugin.pluginPath}/lyrics`;
										const cachedLyricPath = `${lyricsPath}/${musicId}.json`;
										setCurrentLyrics(PURE_MUSIC_LYRIC_LINE);
										try {
											if (!(await betterncm.fs.exists(lyricsPath))) {
												betterncm.fs.mkdir(lyricsPath);
											}
											await betterncm.fs.writeFile(
												cachedLyricPath,
												JSON.stringify(PURE_MUSIC_LYRIC_DATA, null, 4),
											);
										} catch {}
									}}
								>
									这是纯音乐
								</Button>
							</Button.Group>
							<Modal
								title="输入音乐 ID 以加载对应的歌词"
								opened={selectMusicIdModalOpened}
								onClose={() => setSelectMusicIdModalOpened(false)}
								closeOnClickOutside={!selectMusicIdModalLoading}
								centered
								zIndex={151}
							>
								<LoadingOverlay
									visible={selectMusicIdModalLoading}
									radius="sm"
									zIndex={153}
									size={50}
									loaderProps={{ style: { width: "50px", height: "50px" } }}
								/>
								<SongView id={selectMusicId} />
								<NumberInput
									label="音乐 ID"
									hideControls
									value={selectMusicId}
									onChange={setSelectMusicId}
								/>
								<Space h="xl" />
								<Button
									onClick={async () => {
										if (selectMusicId) {
											setSelectMusicIdModalLoading(true);
											try {
												const data = await loadLyric(selectMusicId);
												const lyricsPath = `${plugin.pluginPath}/lyrics`;
												const cachedLyricPath = `${lyricsPath}/${musicId}.json`;
												if (!(await betterncm.fs.exists(lyricsPath))) {
													betterncm.fs.mkdir(lyricsPath);
												}
												await betterncm.fs.writeFile(
													cachedLyricPath,
													JSON.stringify(data),
												);
												await reloadLyricByCurrentAudioId();
												setSelectMusicIdModalOpened(false);
											} catch (err) {
												warn("警告：歌词加载失败", err);
											}
											setSelectMusicIdModalLoading(false);
										}
									}}
								>
									使用该音乐
								</Button>
							</Modal>
							<Modal
								title="导入歌词文件"
								opened={selectLocalLyricModalOpened}
								closeOnClickOutside={!selectLocalLyricModalLoading}
								onClose={() => setLocalLyricModalOpened(false)}
								centered
								zIndex={151}
							>
								<LoadingOverlay
									visible={selectLocalLyricModalLoading}
									radius="sm"
									zIndex={153}
									size={50}
									loaderProps={{ style: { width: "50px", height: "50px" } }}
								/>
								<FileInput
									label="原文歌词文件"
									value={originalLyricFile}
									onChange={setOriginalLyricFile}
								/>
								<Space h="md" />
								<FileInput
									label="翻译歌词文件"
									value={translatedLyricFile}
									onChange={setTranslatedLyricFile}
								/>
								<Space h="md" />
								<FileInput
									label="音译歌词文件"
									value={romanLyricFile}
									onChange={setRomanLyricFile}
								/>
								<Space h="md" />
								<FileInput
									label="逐词歌词文件"
									value={dynamicLyricFile}
									onChange={setDynamicLyricFile}
								/>
								<Space h="xl" />
								<Button
									disabled={!originalLyricFile}
									onClick={async () => {
										if (originalLyricFile) {
											setLocalLyricModalLoading(true);
											try {
												const lyricsPath = `${plugin.pluginPath}/lyrics`;
												const cachedLyricPath = `${lyricsPath}/${musicId}.json`;
												if (!(await betterncm.fs.exists(lyricsPath))) {
													betterncm.fs.mkdir(lyricsPath);
												}
												const lrc = await originalLyricFile.text();
												const tlyric =
													(await translatedLyricFile?.text()) || "";
												const romalrc = (await romanLyricFile?.text()) || "";
												const yrc = (await dynamicLyricFile?.text()) || "";
												await betterncm.fs.writeFile(
													cachedLyricPath,
													JSON.stringify({
														sgc: false,
														sfy: false,
														qfy: false,
														lyricUser: {
															id: 0,
															status: 0,
															demand: 0,
															userid: 0,
															nickname: "手动添加的歌词",
															uptime: Date.now(),
														},
														lrc: {
															version: 0,
															lyric: lrc,
														},
														klyric: {
															version: 0,
															lyric: "",
														},
														tlyric: {
															version: 0,
															lyric: tlyric,
														},
														romalrc: {
															version: 0,
															lyric: romalrc,
														},
														yrc: {
															version: 0,
															lyric: yrc,
														},
														code: 200,
													}),
												);
												await reloadLyricByCurrentAudioId();
												setLocalLyricModalOpened(false);
											} catch (err) {
												warn("警告：歌词转换失败", err);
											}
											setLocalLyricModalLoading(false);
										}
									}}
								>
									使用该歌词
								</Button>
							</Modal>
						</div>
					)
				) : (
					<Center className="am-lyric-view-loading">
						<Loader size={50} style={{ width: "50px", height: "50px" }} />
					</Center>
				)}
			</div>
		</ThemeProvider>
	);
};

import {
	classname,
	genAudioPlayerCommand,
	getLyric,
	getPlayingSong,
	PlayState,
	useConfig,
} from "./api";
import { log, warn } from "./logger";
import { LyricDots } from "./lyric-dots";
import { LyricLine, parseLyric } from "./lyric-parser";
import { Tween, Easing } from "./tweenjs";
import CircularProgress from "@mui/material/CircularProgress";
import * as React from "react";
import { GLOBAL_EVENTS } from "./global-events";

// 猜测歌词的阅读时间，大概根据中日英文简单计算，返回单位毫秒的阅读时间
function guessTextReadDuration(text: string): number {
	const wordRegexp = /^([A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\-]+)$/;
	let wordCount = 0;
	// 以空格和各种标点符号分隔
	for (const word of text.split(
		/[ 　,，.。·、…？?"“”*&\^%\$#@!！\(\)（）\=\+_【】\[\]\{\}\/|]+/,
	)) {
		if (wordRegexp.test(word)) {
			wordCount++;
		} else {
			wordCount += word.length;
		}
	}
	return (wordCount / 400) * 60 * 1000;
}

const useForceUpdate = (): [{}, () => void] => {
	const [updateState, setUpdateState] = React.useState({});
	const forceUpdate = React.useCallback(() => setUpdateState({}), []);
	return [updateState, forceUpdate];
};

const LyricLineView: React.FC<{
	offset: number;
	selected: boolean;
	line: LyricLine;
	dynamic: boolean;
	translated: boolean;
	roman: boolean;
	edit: boolean;
	onClickLyric?: (line: LyricLine) => void;
	onUpdateLyric?: (newLine: LyricLine) => void;
	onInsertLyric?: () => void;
}> = (props) => {
	const [editingLine, setEditingLine] = React.useState(props.line);
	const timeFormated = React.useMemo(() => {
		const t = props.line.time / 1000;
		const s = t % 60;
		const m = Math.floor((t - s) / 60);
		const ss = s.toFixed(3);
		const mm = m.toString();
		return `${"0".repeat(Math.max(0, 2 - mm.length))}${mm}:${"0".repeat(
			Math.max(0, 6 - ss.length),
		)}${ss}`;
	}, [props.line.time]);

	React.useEffect(() => {
		setEditingLine(props.line);
	}, [props.line]);

	React.useEffect(() => {
		setEditingLine(props.line);
	}, [props.edit, props.selected]);

	if (props.edit) {
		return (
			<div
				className={classname("am-lyric-line-edit", {
					"am-lyric-line-selected": props.selected,
				})}
			>
				<div className="edit-time">{timeFormated}</div>
				<div className="edit-area">
					<input
						type='text'
						value={editingLine.originalLyric}
						placeholder="原文歌词"
					/>
					<input
						type='text'
						value={editingLine.translatedLyric}
						placeholder="翻译歌词"
					/>
					<input
						type='text'
						value={editingLine.romanLyric}
						placeholder="翻译歌词"
					/>
				</div>
				<div className="edit-arrow">◀</div>
			</div>
		);
	} else {
		return (
			// rome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
			<div
				onClick={() => {
					if (props.onClickLyric) props.onClickLyric(props.line);
				}}
				className={classname("am-lyric-line", {
					"am-lyric-line-before": props.offset < 0,
					"am-lyric-line-after": props.offset > 0,
					"am-lyric-line-selected": props.selected,
					[`am-lyric-line-o${props.offset}`]: Math.abs(props.offset) < 5,
				})}
			>
				{props.dynamic &&
				props.line.dynamicLyric &&
				props.line.dynamicLyricTime ? (
					<div className="am-lyric-line-dynamic">
						{props.line.dynamicLyric.map((word, i) => (
							<span
								// rome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								key={i}
								style={{
									animationDelay: `${
										word.time - (props.line.dynamicLyricTime || 0)
									}ms`,
									animationDuration: `${word.duration}ms`,
								}}
							>
								{word.word}
							</span>
						))}
					</div>
				) : (
					<div className="am-lyric-line-original">
						{props.line.originalLyric}
					</div>
				)}
				<div className="am-lyric-line-translated">
					{props.translated ? props.line.translatedLyric : ""}
				</div>
				<div className="am-lyric-line-roman">
					{props.roman ? props.line.romanLyric : ""}
				</div>
			</div>
		);
	}
};

export const LyricView: React.FC = () => {
	const [currentAudioId, setCurrentAudioId] = React.useState("");
	const [currentAudioDuration, setAudioDuration] = React.useState(0);
	const [lyricEditMode, setLyricEditMode] = React.useState(false);
	const [error, setError] = React.useState<Error | null>(null);
	const [playState, setPlayState] = React.useState(getPlayingSong().state);
	const [currentLyrics, setCurrentLyrics] = React.useState<LyricLine[] | null>(
		null,
	);
	const albumImageUrl = React.useMemo(() => {
		const songData = getPlayingSong();
		return (
			songData?.data?.album?.picUrl ||
			`orpheus://localmusic/pic?${encodeURIComponent(songData?.from?.playFile)}`
		);
	}, [currentAudioId]);
	const album = React.useMemo(
		() => getPlayingSong()?.data?.album || {},
		[currentAudioId],
	);
	const songName: string = React.useMemo(
		() => getPlayingSong()?.data?.name || "未知歌名",
		[currentAudioId],
	);
	const songAliasName: string[] = React.useMemo(
		() => getPlayingSong()?.data?.alias || [],
		[currentAudioId],
	);
	const songArtists = React.useMemo(
		() => getPlayingSong()?.data?.artists || [],
		[currentAudioId],
	);
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

	const loadLyric = React.useCallback(async (id: number) => {
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
	}, []);

	React.useEffect(() => {
		let canceled = false;
		(async () => {
			setError(null);
			try {
				const lyric = await loadLyric(getPlayingSong().data.id);
				log("已获取到歌词", lyric);
				const parsed = parseLyric(
					lyric?.lrc?.lyric || "",
					lyric?.tlyric?.lyric || "",
					lyric?.romalrc?.lyric || "",
					lyric?.yrc?.lyric || "",
				);
				log(lyric, parsed);
				if (!canceled) {
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
	}, [currentAudioId]);

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
				let lyricElement: Element | null =
					lyricListElement.current.children.item(scrollToIndex);
				if (lyricElement && lyricView) {
					// log(lyricElement, scrollTween.current?.lyricElement);
					if (mustScroll) {
						scrollTween.current = undefined;
					}
					if (lyricElement !== scrollTween.current?.lyricElement) {
						const listRect = lyricView.getBoundingClientRect();
						const lineRect = lyricElement.getBoundingClientRect();
						const lineHeight = lineRect.height;
						const scrollDelta =
							lineRect.top -
							listRect.top +
							30 +
							16 * 2 -
							(listRect.height - lineHeight) / 2;
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
									const scrollDelta =
										lineRect.top -
										listRect.top +
										30 +
										16 * 2 -
										(listRect.height - lineHeight) / 2;
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
				}
			}
		},
		[currentLyricIndex],
	);

	const onSeekToLyric = React.useCallback(
		(line: LyricLine) => {
			if (!lyricEditMode) {
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
			}
		},
		[currentAudioId, lyricEditMode, configDynamicLyric, currentAudioDuration],
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
				changeTime - lastUpdateTime.current <= guessedLineReadTime &&
				playState === PlayState.Playing
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
		[currentLyrics, playState],
	);

	React.useEffect(() => {
		return () => {
			lastIndex.current = currentLyricIndex;
		};
	}, [currentLyricIndex]);

	React.useEffect(() => {
		if (!lyricEditMode) {
			checkIfTooFast(currentLyricIndex);
			scrollToLyric();
		}
	}, [
		scrollToLyric,
		checkIfTooFast,
		lyricEditMode,
		currentLyrics,
		currentLyricIndex,
	]);

	React.useEffect(() => {
		if (!lyricEditMode) {
			checkIfTooFast(currentLyricIndex);
			scrollToLyric();
		}
	}, []);

	React.useEffect(() => {
		const onPlayProgress = (
			audioId: string,
			progress: number,
			playState: PlayState,
		) => {
			const time = (progress * 1000) | 0;
			if (!currentLyrics) return setPlayState(playState);
			let curLyricIndex = -1;
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
			setCurrentLyricIndex(curLyricIndex);
			setPlayState(playState);
		};

		const onPlayStateChange = (
			audioId: string,
			state: string,
			playState: PlayState,
		) => {
			setCurrentAudioId(audioId);
			setPlayState(playState);
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
	}, [currentLyrics, configDynamicLyric]);

	const mapCurrentLyrics = React.useCallback(
		(line: LyricLine, index: number, lines: LyricLine[]) => {
			let isTooFast = keepSelectLyrics.current.has(index); // 如果歌词太快，我们就缓和一下
			if (line.originalLyric.trim().length > 0 || lyricEditMode) {
				const offset = index - currentLyricIndex;
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
						edit={lyricEditMode}
					/>
				);
			} else {
				let duration = 0;
				if (lines[index + 1]) {
					if (configDynamicLyric) {
						duration =
							(lines[index + 1].dynamicLyricTime || lines[index + 1].time) -
							line.time;
					} else {
						duration = lines[index + 1].time - line.time;
					}
				}
				return (
					<LyricDots
						key={index}
						selected={index === currentLyricIndex}
						time={line.time}
						duration={duration}
					/>
				);
			}
		},
		[
			onSeekToLyric,
			lyricEditMode,
			currentLyrics,
			currentLyricIndex,
			configDynamicLyric,
			configTranslatedLyric,
			configRomanLyric,
		],
	);

	return (
		<>
			<div className="am-music-info">
				<div>
					<div className="am-album-image">
						<div>
							<img alt="专辑图片" src={albumImageUrl} />
						</div>
					</div>
					<div className="am-music-name">{songName}</div>
					{songAliasName.length > 0 ? (
						<div className="am-music-alias">
							{songAliasName.map((alia, index) => (
								<div key={index}>{alia}</div>
							))}
						</div>
					) : (
						<></>
					)}
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
					{album ? (
						<div className="am-music-album">
							<div className="am-album-label">专辑：</div>
							<div className="am-album">
								<a href={`#/m/album/?id=${album?.id}`}>{album.name}</a>
							</div>
						</div>
					) : (
						<></>
					)}
				</div>
			</div>
			<div className="am-lyric">
				<div
					className={classname("am-lyric-options", {
						editing: lyricEditMode,
					})}
				>
					{!lyricEditMode ? (
						<>
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
									setConfigDynamicLyric(
										String(!(configDynamicLyric === "true")),
									);
									forceUpdate();
								}}
								className={classname({
									toggled: configDynamicLyric === "true",
								})}
								type="button"
							>
								逐词歌词（实验性）
							</button>
						</>
					) : (
						<></>
					)}
					{DEBUG ? (
						<button
							onClick={() => {
								setLyricEditMode(!lyricEditMode);
							}}
							className={classname({
								toggled: lyricEditMode,
							})}
							type="button"
						>
							歌词编辑模式
						</button>
					) : (
						<></>
					)}
				</div>
				{error ? (
					<div className="am-lyric-view-error">
						<div>歌词加载失败：</div>
						<div>{error.message}</div>
						<div>{error.stack}</div>
					</div>
				) : currentLyrics ? (
					currentLyrics.length > 0 ? (
						<div
							className={classname("am-lyric-view", {
								editing: lyricEditMode,
							})}
						>
							<div ref={lyricListElement}>
								{currentLyrics.map(mapCurrentLyrics)}
							</div>
						</div>
					) : (
						<div className="am-lyric-view-no-lyric">
							没有可用歌词，但是你可以手动指定一个有歌词的音乐来使用它的歌词。（以后会实现的）
						</div>
					)
				) : (
					<div className="am-lyric-view-loading">
						<CircularProgress />
					</div>
				)}
			</div>
		</>
	);
};

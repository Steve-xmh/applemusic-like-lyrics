import {
	classname,
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
			<div
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
						{props.line.dynamicLyric.map((word) => (
							<span
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
	const [lyricEditMode, setLyricEditMode] = React.useState(false);
	const [playState, setPlayState] = React.useState(getPlayingSong().state);
	const [currentLyrics, setCurrentLyrics] = React.useState<LyricLine[] | null>(
		null,
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
		"true",
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
		let cancled = false;
		(async () => {
			const lyric = await loadLyric(getPlayingSong().data.id);
			log("已获取到歌词", lyric);
			const parsed = parseLyric(
				lyric?.lrc?.lyric || "",
				lyric?.tlyric?.lyric || "",
				lyric?.romalrc?.lyric || "",
				lyric?.yrc?.lyric || "",
			);
			log(lyric, parsed);
			if (!cancled) {
				setCurrentLyrics(parsed);
				setCurrentLyricIndex(-1);
				keepSelectLyrics.current.clear();
			}
		})();
		return () => {
			cancled = true;
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
	const scrollToLyric = React.useCallback(() => {
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
				if (lyricElement !== scrollTween.current?.lyricElement) {
					const listRect = lyricView.getBoundingClientRect();
					const lineRect = lyricElement.getBoundingClientRect();
					const lineHeight = lineRect.bottom - lineRect.top;
					const scrollDelta =
						lineRect.top -
						listRect.top +
						30 +
						37.333 +
						16 * 2 -
						(listRect.height - lineHeight) / 2;
					const prevScrollTop = lyricView.scrollTop;
					const obj = { scrollTop: prevScrollTop };
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
				} else {
					// log("触发相同动画播放");
				}
			}
		}
	}, [currentLyricIndex]);

	React.useEffect(() => {
		const btn = document.querySelector(".m-pinfo .cover .f-cp");
		const onWindowSizeChanged = () => {
			setTimeout(() => {
				setCurrentLyricIndex(-1); // 触发歌词更新重新定位
			}, 750);
		};
		const onClick = () => {
			setTimeout(() => {
				setCurrentLyricIndex(-1); // 触发歌词更新重新定位
			}, 1500);
		};

		log("正在挂载按钮事件", btn);

		btn?.addEventListener("click", onClick);
		window.addEventListener("resize", onWindowSizeChanged);
		return () => {
			btn?.removeEventListener("click", onClick);
			window.removeEventListener("resize", onWindowSizeChanged);
		};
	}, []);

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
		const onPlayProgress = (
			audioId: string,
			progress: number,
			playState: PlayState,
		) => {
			const time = Math.floor(progress * 1000);
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
		};
	}, [currentLyrics, configDynamicLyric]);

	const mapCurrentLyrics = React.useCallback(
		(line: LyricLine, index: number, lines: LyricLine[]) => {
			let isTooFast = keepSelectLyrics.current.has(index); // 如果歌词太快，我们就缓和一下
			if (line.originalLyric.trim().length > 0 || lyricEditMode) {
				const offset = index - currentLyricIndex;
				return (
					<LyricLineView
						selected={index === currentLyricIndex || isTooFast}
						line={line}
						translated={configTranslatedLyric === "true"}
						dynamic={configDynamicLyric === "true"}
						roman={configRomanLyric === "true"}
						offset={offset}
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
						selected={index === currentLyricIndex}
						time={line.time}
						duration={duration}
					/>
				);
			}
		},
		[
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
					</>
				) : (
					<></>
				)}
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
			</div>
			{currentLyrics ? (
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
						没有可用歌词，但是你可以手动指定一个有歌词的音乐来使用它的歌词。
					</div>
				)
			) : (
				<div className="am-lyric-view-loading">
					<CircularProgress />
					正在加载歌词
				</div>
			)}
		</>
	);
};

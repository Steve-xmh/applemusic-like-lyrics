import { classname, genAudioPlayerCommand, PlayState } from "../../api";
import { useAtom, useAtomValue } from "jotai";
import * as React from "react";
import { useConfigValueBoolean } from "../../api/react";
import {
	currentAudioDurationAtom,
	currentAudioIdAtom,
	currentLyricsAtom,
	currentLyricsIndexesAtom,
	currentRawLyricRespAtom,
	playStateAtom,
	songArtistsAtom,
} from "../../core/states";
import { GLOBAL_EVENTS } from "../../utils/global-events";
import { log } from "../../utils/logger";
import { LyricLine } from "../../core/lyric-parser";
import { LyricLineView } from "./lyric-line";
import { LyricDots } from "./lyric-dots";
import { eqSet } from "../../utils";

export const LyricRendererContext = React.createContext({
	lyricPageSize: [0, 0],
	currentLyrics: [] as LyricLine[],
});

export interface LyricLineTransform {
	top: number;
	left: number;
	scale: number;
	duration: number;
	delay: number;
	userScrolling?: boolean;
	initialized: boolean;
}

export interface LyricLineMeta {
	height: number;
	isDots: boolean;
	isBGLyric: boolean;
}

export const LyricDOMRenderer: React.FC = () => {
	const currentAudioId = useAtomValue(currentAudioIdAtom);
	const currentAudioDuration = useAtomValue(currentAudioDurationAtom);
	const currentLyricsA = useAtomValue(currentLyricsAtom);
	const songArtists = useAtomValue(songArtistsAtom);
	const currentRawLyricResp = useAtomValue(currentRawLyricRespAtom);
	// 实现复用
	const [currentLyrics, setCurrentLyrics] = React.useState(currentLyricsA);

	const playState = useAtomValue(playStateAtom);

	const [currentLyricIndexes, setCurrentLyricIndexes] = useAtom(
		currentLyricsIndexesAtom,
	);

	const [cachedLyricIndexes, setCachedLyricIndexes] =
		React.useState(currentLyricIndexes);

	const lyricListElement = React.useRef<HTMLDivElement>(null);
	const keepSelectLyrics = React.useRef<Set<number>>(new Set());

	const configTranslatedLyric = useConfigValueBoolean("translated-lyric", true);
	const configDynamicLyric = useConfigValueBoolean("dynamic-lyric", false);
	const configRomanLyric = useConfigValueBoolean("roman-lyric", true);
	const lyricScaleEffect = useConfigValueBoolean("lyricScaleEffect", false);
	const noCacheLyricState = useConfigValueBoolean("noCacheLyricState", false);

	const alignTopSelectedLyric = useConfigValueBoolean(
		"alignTopSelectedLyric",
		false,
	);

	const lineHeights = React.useRef<LyricLineMeta[]>([]);
	const viewHeight = React.useRef<[number, number]>([
		window.innerHeight,
		window.innerWidth,
	]);
	const [lineTransforms, setLineTransforms] = React.useState<
		LyricLineTransform[]
	>([]);

	React.useLayoutEffect(() => {
		setCachedLyricIndexes((prev) => {
			if (eqSet(prev, currentLyricIndexes)) {
				return prev;
			} else {
				for (const i of currentLyricIndexes) {
					if (prev.has(i)) {
						const result = new Set<number>();
						prev.forEach((v) => result.add(v));
						currentLyricIndexes.forEach((v) => result.add(v));
						return result;
					}
				}
				return currentLyricIndexes;
			}
		});
	}, [currentLyricIndexes]);

	const scrollDelayRef = React.useRef(0);
	const cachedLyricIndex = React.useRef(currentLyricIndexes);
	const lastLyricTransform = React.useRef<LyricLineTransform[]>([]);
	const lastScrollTime = React.useRef(Date.now());
	const scrollToLyric = React.useCallback(
		(
			mustScroll: boolean = false,
			currentLyricIndexes = cachedLyricIndex.current,
		) => {
			// log("触发滚动函数", lineHeights.current);
			cachedLyricIndex.current = currentLyricIndexes;
			if (lyricListElement.current) {
				let scrollToIndex = Number.MAX_SAFE_INTEGER;
				if (
					cachedLyricIndex.current.size + keepSelectLyrics.current.size ===
					0
				) {
					scrollToIndex = 0;
				}
				for (const i of cachedLyricIndex.current) {
					if (scrollToIndex > i) {
						scrollToIndex = i;
					}
				}
				for (const i of keepSelectLyrics.current) {
					if (scrollToIndex > i) {
						scrollToIndex = i;
					}
				}
				const isPrevDots =
					lineHeights.current[scrollToIndex - 1]?.isDots ?? false;
				const curLine = lineHeights.current[scrollToIndex];
				let curLineHeight = curLine?.height ?? 0;
				if (curLine?.isDots && lineHeights.current[scrollToIndex + 1]) {
					curLineHeight = lineHeights.current[scrollToIndex + 1].height;
				}
				const scaleRatio = lyricScaleEffect ? 0.9 : 1;

				let scrollHeight = -lineHeights.current
					.slice(0, Math.max(0, scrollToIndex))
					.reduce(
						(pv, cv) => pv + (cv.isDots || cv.isBGLyric ? 0 : cv.height),
						0,
					);

				const songInfoElement = document.querySelector(".am-player-song-info");
				const albumElement = document.querySelector(".am-album-image");
				if (alignTopSelectedLyric) {
					scrollHeight += viewHeight.current[1] * 0.1;
				} else if (albumElement && songInfoElement) {
					const pRect = songInfoElement.getBoundingClientRect();
					const rect = albumElement.getBoundingClientRect();
					scrollHeight +=
						rect.top - pRect.top + (rect.height - curLineHeight) / 2;
				} else {
					scrollHeight += (viewHeight.current[1] - curLineHeight) / 2;
				}

				let i = 0;
				let curDelay = 0;
				const curTime = Date.now();
				const duration = mustScroll
					? 0
					: Math.min(750, Math.max(0, curTime - lastScrollTime.current));
				lastScrollTime.current = curTime;
				const result: LyricLineTransform[] = [];
				for (const height of lineHeights.current) {
					const lineTransform: LyricLineTransform = {
						top: scrollHeight,
						left: 0,
						scale: scaleRatio,
						duration: duration,
						delay: mustScroll ? 0 : Math.max(0, Math.min(curDelay, 1000)),
						initialized: true,
					};
					if (
						scrollHeight > viewHeight.current[1] * 2 ||
						scrollHeight + height.height < -viewHeight.current[1]
					) {
						lineTransform.duration = 0;
						lineTransform.delay = 0;
					} else if (
						!(
							scrollHeight > viewHeight.current[1] ||
							scrollHeight + height.height < 0
						) &&
						(isPrevDots ? i > 0 : true) &&
						lastLyricTransform.current[i]?.top !== lineTransform.top
					) {
						curDelay += 75;
					}
					if (
						i === scrollToIndex ||
						keepSelectLyrics.current.has(i) ||
						cachedLyricIndex.current.has(i)
					) {
						lineTransform.scale = 1;
						if (
							lineHeights.current[i].isDots ||
							lineHeights.current[i].isBGLyric
						) {
							scrollHeight += lineHeights.current[i].height;
						}
					}
					i++;
					if (!(height.isDots || height.isBGLyric)) {
						scrollHeight += height.height;
					}
					result.push(lineTransform);
				}

				// log("已计算新布局", result);

				setLineTransforms(result);
				lastLyricTransform.current = result;
			}
		},
		[alignTopSelectedLyric, lyricScaleEffect],
	);

	const recalculateLineHeights = React.useCallback(() => {
		// 计算每个歌词行的高度，用于布局计算
		const el = lyricListElement.current;
		if (el) {
			lineHeights.current = [...el.children].map((el) => ({
				height: el.clientHeight,
				isDots: el.classList.contains("am-lyric-dots"),
				isBGLyric: el.classList.contains("am-lyric-line-bg-lyric"),
			}));
			// warn("已触发高度重新计算", lineHeights.current);
		}
	}, []);

	const [firstLyricIndex, setFirstLyricIndex] = React.useState(-1);

	React.useEffect(() => {
		if (cachedLyricIndexes.size > 0) {
			let i = -1;
			for (const v of cachedLyricIndexes) {
				if (i < v) {
					i = v;
				}
			}
			setFirstLyricIndex(i);
		}
	}, [cachedLyricIndexes]);

	React.useLayoutEffect(() => {
		if (currentLyricsA || noCacheLyricState) {
			setCurrentLyrics(currentLyricsA);
			setFirstLyricIndex(-1);
		}
		setLineTransforms([]);
	}, [currentLyricsA, scrollToLyric, recalculateLineHeights]);

	React.useEffect(() => {
		recalculateLineHeights();
		scrollToLyric(true);
	}, [currentLyrics]);

	React.useLayoutEffect(() => {
		scrollDelayRef.current = 0;
		cachedLyricIndex.current = new Set();
		keepSelectLyrics.current.clear();
		recalculateLineHeights();
		scrollToLyric(true, new Set());
	}, [
		currentLyrics,
		configTranslatedLyric,
		configDynamicLyric,
		configRomanLyric,
		alignTopSelectedLyric,
	]);

	React.useLayoutEffect(() => {
		const el = lyricListElement.current;
		if (el) {
			viewHeight.current = [el.clientWidth, el.clientHeight];
			el.style.setProperty(
				"--amll-lyric-view-width",
				`${viewHeight.current[0]}px`,
			);

			const obz = new ResizeObserver(() => {
				viewHeight.current = [el.clientWidth, el.clientHeight];
				el.style.setProperty(
					"--amll-lyric-view-width",
					`${viewHeight.current[0]}px`,
				);
				recalculateLineHeights();
				scrollToLyric(true);
			});

			obz.observe(el);

			return () => {
				obz.disconnect();
			};
		}
	}, [scrollToLyric, recalculateLineHeights, alignTopSelectedLyric]);

	React.useLayoutEffect(() => {
		const btn = document.querySelector("a[data-action='max']");
		const onWindowSizeChanged = () => {
			scrollToLyric(true); // 触发歌词更新重新定位
		};
		const onLyricOpened = () => {
			keepSelectLyrics.current.clear();
			cachedLyricIndexes.forEach((v) => keepSelectLyrics.current.add(v));
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
	}, [scrollToLyric, cachedLyricIndexes]);

	const onSeekToLyric = React.useCallback(
		(line: LyricLine, evt: React.MouseEvent) => {
			if (evt.button === 0) {
				// 鼠标主键点击，跳转到歌词
				scrollDelayRef.current = 0;
				if (currentLyrics) {
					const index = currentLyrics.findIndex((v) => v === line);
					keepSelectLyrics.current.clear();
					setCurrentLyricIndexes(new Set([index]));
				}
				if (
					configDynamicLyric &&
					(line.dynamicLyricTime ||
						currentAudioDuration < currentAudioDuration) &&
					(line.dynamicLyricTime || -1) >= 0
				) {
					log("正在跳转到歌词时间", line?.dynamicLyricTime || line.beginTime);
					legacyNativeCmder._envAdapter.callAdapter(
						"audioplayer.seek",
						() => {},
						[
							currentAudioId,
							genAudioPlayerCommand(currentAudioId, "seek"),
							(line?.dynamicLyricTime || line.beginTime) / 1000,
						],
					);
				} else if (
					line.beginTime < currentAudioDuration &&
					line.beginTime >= 0
				) {
					log("正在跳转到歌词时间", line.beginTime);
					legacyNativeCmder._envAdapter.callAdapter(
						"audioplayer.seek",
						() => {},
						[
							currentAudioId,
							genAudioPlayerCommand(currentAudioId, "seek"),
							line.beginTime / 1000,
						],
					);
				}
			} else if (evt.button === 2) {
				// 鼠标副键点击，复制歌词
				let text = "";
				if (configDynamicLyric && line.dynamicLyric) {
					text += line.dynamicLyric.map((v) => v.word).join("");
				} else {
					text += line.originalLyric;
				}
				if (configTranslatedLyric && line.translatedLyric) {
					text += "\n";
					text += line.translatedLyric;
				}
				if (configRomanLyric && line.romanLyric) {
					text += "\n";
					text += line.romanLyric;
				}
				legacyNativeCmder._envAdapter.callAdapter(
					"winhelper.setClipBoardData",
					() => {},
					[text.trim()],
				);
			}
		},
		[
			currentAudioId,
			configTranslatedLyric,
			configRomanLyric,
			configDynamicLyric,
			currentAudioDuration,
		],
	);

	const memoIndexes = React.useRef(new Set<number>());
	React.useLayoutEffect(() => {
		if (
			playState === PlayState.Playing &&
			Date.now() - scrollDelayRef.current > 2000
		) {
			if (!eqSet(memoIndexes.current, currentLyricIndexes)) {
				scrollToLyric(false, cachedLyricIndexes);
				memoIndexes.current = currentLyricIndexes;
			}
		}
	}, [scrollToLyric, currentLyrics, cachedLyricIndexes, playState]);

	React.useLayoutEffect(() => {
		const el = lyricListElement.current;
		if (el) {
			const onLyricScroll = (evt: WheelEvent) => {
				evt.preventDefault();
				evt.stopPropagation();
				scrollDelayRef.current = Date.now();
				setLineTransforms((list) => {
					return list.map((v) => ({
						top: v.top - evt.deltaY,
						duration: 0,
						delay: 0,
						left: v.left,
						scale: v.scale,
						userScrolling: true,
						initialized: true,
					}));
				});
				return false;
			};

			el.addEventListener("wheel", onLyricScroll, { passive: false });

			return () => {
				el.removeEventListener("wheel", onLyricScroll);
			};
		}
	}, [alignTopSelectedLyric]);

	const creditLineTransform: LyricLineTransform = React.useMemo(() => {
		const trans: LyricLineTransform = {
			top: 0,
			left: 0,
			scale: 1,
			duration: 750,
			delay: 0,
			initialized: true,
		};
		if (lineTransforms.length > 0) {
			const lastLineTransform = lineTransforms[lineTransforms.length - 1];
			trans.top = lastLineTransform.top;
			trans.duration = lastLineTransform.duration;
			trans.delay = lastLineTransform.delay;
		}
		return trans;
	}, [lineTransforms]);

	return (
		<LyricRendererContext.Provider
			value={{
				lyricPageSize: viewHeight.current,
				currentLyrics: currentLyrics ?? [],
			}}
		>
			<div
				className={classname("am-lyric-view", {
					"am-lyric-pause-all": playState === PlayState.Pausing,
				})}
			>
				<div ref={lyricListElement}>
					{currentLyrics?.map(
						(line: LyricLine, index: number, _lines: LyricLine[]) => {
							const offset = index - firstLyricIndex;
							if (line.originalLyric.trim().length > 0) {
								return (
									<LyricLineView
										key={`${index}-${line.beginTime}-${line.originalLyric}`}
										lineTransform={
											lineTransforms[index] ??
											({
												top: 10000,
												left: 0,
												scale: 1,
												duration: 0,
												delay: 0,
												opacity: 0,
												initialized: false,
											} as LyricLineTransform)
										}
										onSizeChanged={() =>
											requestAnimationFrame(recalculateLineHeights)
										}
										selected={cachedLyricIndexes.has(index)}
										line={line}
										translated={configTranslatedLyric}
										dynamic={configDynamicLyric}
										roman={configRomanLyric}
										offset={offset}
										onClickLyric={onSeekToLyric}
									/>
								);
							} else {
								return (
									<LyricDots
										onSizeChanged={() =>
											requestAnimationFrame(recalculateLineHeights)
										}
										key={`${index}-dots`}
										lineTransform={
											lineTransforms[index] ??
											({
												top: 10000,
												left: 0,
												scale: 1,
												duration: 0,
												delay: 0,
												opacity: 0,
												initialized: false,
											} as LyricLineTransform)
										}
										selected={cachedLyricIndexes.has(index)}
										time={line.beginTime}
										offset={offset}
										duration={line.duration}
									/>
								);
							}
						},
					)}
					<div
						className="am-lyric-credits"
						style={{
							transform: `translateY(${creditLineTransform.top}px) translateX(${creditLineTransform.left}) scale(${creditLineTransform.scale})`,
							transition: `all ${creditLineTransform.duration}ms cubic-bezier(0.46, 0, 0.07, 1) ${creditLineTransform.delay}ms`,
						}}
					>
						<div>创作者：{songArtists.map((v) => v.name).join(", ")}</div>
						{currentRawLyricResp.lyricUser && (
							<div>
								原文歌词贡献者：{currentRawLyricResp.lyricUser.nickname}
							</div>
						)}
						{currentRawLyricResp.transUser && (
							<div>
								翻译歌词贡献者：{currentRawLyricResp.transUser.nickname}
							</div>
						)}
					</div>
				</div>
			</div>
		</LyricRendererContext.Provider>
	);
};

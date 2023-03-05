import { genAudioPlayerCommand, PlayState } from "../../api";
import { useAtom, useAtomValue } from "jotai";
import * as React from "react";
import { useConfigValueBoolean } from "../../api/react";
import {
	currentAudioDurationAtom,
	currentAudioIdAtom,
	currentLyricsAtom,
	currentLyricsIndexesAtom,
	playStateAtom,
} from "../../core/states";
import { GLOBAL_EVENTS } from "../../utils/global-events";
import { log } from "../../utils/logger";
import { LyricLine } from "../../core/lyric-parser";
import { LyricLineView } from "./lyric-line";
import { LyricDots } from "./lyric-dots";

export interface LyricLineTransform {
	top: number;
	scale: number;
	duration: number;
	delay: number;
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
	// 实现复用
	const [currentLyrics, setCurrentLyrics] = React.useState(currentLyricsA);

	const playState = useAtomValue(playStateAtom);

	const [currentLyricIndexes, setCurrentLyricIndexes] = useAtom(
		currentLyricsIndexesAtom,
	);

	const lyricListElement = React.useRef<HTMLDivElement>(null);
	const keepSelectLyrics = React.useRef<Set<number>>(new Set());

	const configTranslatedLyric = useConfigValueBoolean("translated-lyric", true);
	const configDynamicLyric = useConfigValueBoolean("dynamic-lyric", false);
	const configRomanLyric = useConfigValueBoolean("roman-lyric", true);
	const lyricScaleEffect = useConfigValueBoolean("lyricScaleEffect", false);

	const alignTopSelectedLyric = useConfigValueBoolean(
		"alignTopSelectedLyric",
		false,
	);

	const lineHeights = React.useRef<LyricLineMeta[]>([]);
	const viewHeight = React.useRef<number>(window.innerHeight);
	const [lineTransforms, setLineTransforms] = React.useState<
		LyricLineTransform[]
	>([]);

	const scrollDelayRef = React.useRef(0);
	const cachedLyricIndex = React.useRef(currentLyricIndexes);
	const scrollToLyric = React.useCallback(
		(
			mustScroll: boolean = false,
			currentLyricIndexes = cachedLyricIndex.current,
		) => {
			cachedLyricIndex.current = currentLyricIndexes;
			if (lyricListElement.current) {
				let scrollToIndex = Number.MAX_SAFE_INTEGER;
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
				const curLine = lineHeights.current[scrollToIndex];
				let curLineHeight = curLine?.height ?? 0;
				if (curLine?.isDots && lineHeights.current[scrollToIndex + 1]) {
					curLineHeight = lineHeights.current[scrollToIndex + 1].height;
				}
				const scaleRatio = lyricScaleEffect ? 0.9 : 1;

				let scrollHeight = -lineHeights.current
					.slice(0, Math.max(0, scrollToIndex))
					.reduce(
						(pv, cv) =>
							pv + (cv.isDots || cv.isBGLyric ? 0 : cv.height * scaleRatio),
						0,
					);

				const songInfoElement = document.querySelector(".am-player-song-info");
				const albumElement = document.querySelector(".am-album-image");
				if (alignTopSelectedLyric) {
					scrollHeight += viewHeight.current * 0.1;
				} else if (albumElement && songInfoElement) {
					const pRect = songInfoElement.getBoundingClientRect();
					const rect = albumElement.getBoundingClientRect();
					scrollHeight +=
						rect.top - pRect.top + (rect.height - curLineHeight) / 2;
				} else {
					scrollHeight += (viewHeight.current - curLineHeight) / 2;
				}

				let i = 0;
				const result: LyricLineTransform[] = [];
				for (const height of lineHeights.current) {
					const lineTransform: LyricLineTransform = {
						top: scrollHeight,
						scale: scaleRatio,
						duration: mustScroll ? 0 : 500,
						delay: mustScroll
							? 0
							: Math.max(0, Math.min((i - scrollToIndex) * 100, 1000)),
					};
					if (
						scrollHeight > viewHeight.current ||
						scrollHeight + height.height < 0
					) {
						lineTransform.duration = 0;
						lineTransform.delay = 0;
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
							scrollHeight +=
								lineHeights.current[i].height * lineTransform.scale;
						}
					}
					i++;
					if (!(height.isDots || height.isBGLyric)) {
						scrollHeight += height.height * lineTransform.scale;
					}
					result.push(lineTransform);
				}

				setLineTransforms(result);
			}
		},
		[alignTopSelectedLyric, lyricScaleEffect],
	);

	const recalculateLineHeights = React.useCallback(() => {
		// 计算每个歌词行的高度，用于布局计算
		const el = lyricListElement.current;
		if (el) {
			lineHeights.current = [...el.children].map((el) => ({
				height: el.getBoundingClientRect().height,
				isDots: el.classList.contains("am-lyric-dots"),
				isBGLyric: el.classList.contains("am-lyric-line-bg-lyric"),
			}));
		}
	}, []);

	React.useLayoutEffect(() => {
		if (currentLyricsA) {
			setCurrentLyrics(currentLyricsA);
		}
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
			viewHeight.current = el.clientHeight;

			const obz = new ResizeObserver(() => {
				viewHeight.current = el.clientHeight;
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
			currentLyricIndexes.forEach((v) => keepSelectLyrics.current.add(v));
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
	}, [scrollToLyric, currentLyricIndexes]);

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

	React.useLayoutEffect(() => {
		if (
			playState === PlayState.Playing &&
			Date.now() - scrollDelayRef.current > 2000
		) {
			scrollToLyric(false, currentLyricIndexes);
		}
	}, [scrollToLyric, currentLyrics, currentLyricIndexes, playState]);

	React.useLayoutEffect(() => {
		const el = lyricListElement.current;
		if (el) {
			const onLyricScroll = (evt: WheelEvent) => {
				evt.preventDefault();
				evt.stopPropagation();
				scrollDelayRef.current = Date.now();
				setLineTransforms((list) => {
					return list.map((v) => {
						v.top -= evt.deltaY;
						v.duration = 250;
						v.delay = 0;
						return v;
					});
				});
				return false;
			};

			el.addEventListener("wheel", onLyricScroll, { passive: false });

			return () => {
				el.removeEventListener("wheel", onLyricScroll);
			};
		}
	}, [alignTopSelectedLyric]);

	const firstLyricIndex = React.useMemo(() => {
		let i = -1;
		for (const v of currentLyricIndexes) {
			if (i < v) {
				i = v;
			}
		}
		return i;
	}, [currentLyricIndexes]);

	return (
		<div className="am-lyric-view">
			<div ref={lyricListElement}>
				{currentLyrics?.map(
					(line: LyricLine, index: number, _lines: LyricLine[]) => {
						const offset = index - firstLyricIndex;
						if (line.originalLyric.trim().length > 0) {
							return (
								<LyricLineView
									key={`${index}-${line.beginTime}-${line.originalLyric}`}
									lineTransform={
										lineTransforms[index] ?? {
											top: viewHeight.current,
											scale: 1,
										}
									}
									onSizeChanged={() =>
										requestAnimationFrame(recalculateLineHeights)
									}
									selected={currentLyricIndexes.has(index)}
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
									lineTransform={lineTransforms[index] ?? { top: 0, scale: 1 }}
									selected={currentLyricIndexes.has(index)}
									time={line.beginTime}
									offset={offset}
									duration={line.duration}
								/>
							);
						}
					},
				)}
			</div>
		</div>
	);
};

import { genAudioPlayerCommand, PlayState } from "../../api";
import { useAtom, useAtomValue } from "jotai";
import * as React from "react";
import { useConfigValueBoolean, useForceUpdate } from "../../api/react";
import {
	currentAudioDurationAtom,
	currentAudioIdAtom,
	currentLyricsAtom,
	currentLyricsIndexAtom,
	playStateAtom,
} from "../../core/states";
import { GLOBAL_EVENTS } from "../../utils/global-events";
import { log } from "../../utils/logger";
import { LyricLine } from "../../core/lyric-parser";
import { guessTextReadDuration } from "../../utils";
import { LyricLineView } from "./lyric-line";
import { LyricDots } from "./lyric-dots";

export interface LyricLineTransform {
	top: number;
	scale: number;
	duration: number;
	delay: number;
}

export const LyricDOMRenderer: React.FC = () => {
	const currentAudioId = useAtomValue(currentAudioIdAtom);
	const currentAudioDuration = useAtomValue(currentAudioDurationAtom);
	const currentLyricsA = useAtomValue(currentLyricsAtom);
	// 实现复用
	const [currentLyrics, setCurrentLyrics] = React.useState(currentLyricsA);
	React.useLayoutEffect(() => {
		if (currentLyricsA) {
			setCurrentLyrics(currentLyricsA);
		}
	}, [currentLyricsA]);

	const playState = useAtomValue(playStateAtom);
	const forceUpdate = useForceUpdate();

	const [currentLyricIndex, setCurrentLyricIndex] = useAtom(
		currentLyricsIndexAtom,
	);

	const lyricListElement = React.useRef<HTMLDivElement>(null);
	const keepSelectLyrics = React.useRef<Set<number>>(new Set());

	const configTranslatedLyric = useConfigValueBoolean("translated-lyric", true);
	const configDynamicLyric = useConfigValueBoolean("dynamic-lyric", false);
	const configRomanLyric = useConfigValueBoolean("roman-lyric", true);
	const lyricScaleEffect = useConfigValueBoolean("lyricScaleEffect", false);
	const disableLyricBuffer = useConfigValueBoolean("disableLyricBuffer", false);
	const alignTopSelectedLyric = useConfigValueBoolean(
		"alignTopSelectedLyric",
		false,
	);

	const lineHeights = React.useRef<[number, boolean][]>([]);
	const viewHeight = React.useRef<number>(window.innerHeight);
	const [lineTransforms, setLineTransforms] = React.useState<
		LyricLineTransform[]
	>([]);

	const scrollDelayRef = React.useRef(0);
	const cachedLyricIndex = React.useRef(currentLyricIndex);
	const scrollToLyric = React.useCallback(
		(
			mustScroll: boolean = false,
			currentLyricIndex = cachedLyricIndex.current,
		) => {
			cachedLyricIndex.current = currentLyricIndex;
			if (lyricListElement.current) {
				let scrollToIndex = cachedLyricIndex.current;
				for (const i of keepSelectLyrics.current) {
					if (scrollToIndex > i) {
						scrollToIndex = i;
					}
				}
				const curLineHeight = lineHeights.current[scrollToIndex]?.[0] ?? 0;
				const scaleRatio = lyricScaleEffect ? 0.8 : 1;

				let scrollHeight = -lineHeights.current
					.slice(0, Math.max(0, scrollToIndex))
					.reduce((pv, cv) => pv + (cv[1] ? 0 : cv[0] * scaleRatio), 0);

				if (alignTopSelectedLyric) {
					scrollHeight += viewHeight.current * 0.1;
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
							: Math.max(0, Math.min((i - scrollToIndex) * 15, 500)),
					};
					if (i === scrollToIndex || keepSelectLyrics.current.has(i)) {
						lineTransform.scale = 1;
						if (lineHeights.current[i][1]) {
							scrollHeight += curLineHeight * lineTransform.scale;
						}
					}
					i++;
					if (!height[1]) {
						scrollHeight += height[0] * lineTransform.scale;
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
			lineHeights.current = [...el.children].map((el) => [
				el.clientHeight,
				el.classList.contains("am-lyric-dots"),
			]);
		}
	}, []);

	React.useLayoutEffect(() => {
		scrollDelayRef.current = 0;
		cachedLyricIndex.current = -1;
		keepSelectLyrics.current.clear();
		recalculateLineHeights();
		scrollToLyric(true, -1);
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

	const onSeekToLyric = React.useCallback(
		(line: LyricLine, evt: React.MouseEvent) => {
			if (evt.button === 0) {
				// 鼠标主键点击，跳转到歌词
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
					legacyNativeCmder._envAdapter.callAdapter(
						"audioplayer.seek",
						() => {},
						[
							currentAudioId,
							genAudioPlayerCommand(currentAudioId, "seek"),
							(line?.dynamicLyricTime || line.time) / 1000,
						],
					);
				} else if (line.time < currentAudioDuration && line.time >= 0) {
					log("正在跳转到歌词时间", line.time);
					legacyNativeCmder._envAdapter.callAdapter(
						"audioplayer.seek",
						() => {},
						[
							currentAudioId,
							genAudioPlayerCommand(currentAudioId, "seek"),
							line.time / 1000,
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
				2500,
				Math.max(1000, guessTextReadDuration(lastLyric)),
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

	React.useLayoutEffect(() => {
		return () => {
			lastIndex.current = currentLyricIndex;
		};
	}, [currentLyricIndex]);

	React.useLayoutEffect(() => {
		if (
			playState === PlayState.Playing &&
			Date.now() - scrollDelayRef.current > 2000
		) {
			if (disableLyricBuffer) {
				keepSelectLyrics.current.clear();
			} else {
				checkIfTooFast(currentLyricIndex);
			}
			scrollToLyric(false, currentLyricIndex);
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

	return (
		<div className="am-lyric-view">
			<div ref={lyricListElement}>
				{currentLyrics?.map(
					(line: LyricLine, index: number, _lines: LyricLine[]) => {
						let isTooFast = keepSelectLyrics.current.has(index); // 如果歌词太快，我们就缓和一下
						const offset = index - currentLyricIndex;
						if (line.originalLyric.trim().length > 0) {
							return (
								<LyricLineView
									key={`${index}-${line.time}-${line.originalLyric}`}
									lineTransform={
										lineTransforms[index] ?? {
											top: viewHeight.current,
											scale: 1,
										}
									}
									onSizeChanged={recalculateLineHeights}
									selected={index === currentLyricIndex || isTooFast}
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
									onSizeChanged={recalculateLineHeights}
									key={`${index}-dots`}
									lineTransform={lineTransforms[index] ?? { top: 0, scale: 1 }}
									selected={index === currentLyricIndex}
									time={line.time}
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

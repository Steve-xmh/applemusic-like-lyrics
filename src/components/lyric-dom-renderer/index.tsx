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
import { Tween, Easing } from "../../libs/tweenjs";
import { GLOBAL_EVENTS } from "../../utils/global-events";
import { log } from "../../utils/logger";
import { LyricLine } from "../../core/lyric-parser";
import { guessTextReadDuration } from "../../utils";
import { LyricLineView } from "./lyric-line";
import { LyricDots } from "./lyric-dots";

export const LyricDOMRenderer: React.FC = () => {
	const currentAudioId = useAtomValue(currentAudioIdAtom);
	const currentAudioDuration = useAtomValue(currentAudioDurationAtom);
	const currentLyrics = useAtomValue(currentLyricsAtom);
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
	const alignTopSelectedLyric = useConfigValueBoolean(
		"alignTopSelectedLyric",
		false,
	);

	const scrollTween = React.useRef<
		| {
				lyricElement: Element;
				tween: Tween<{ scrollTop: number }>;
		  }
		| undefined
	>(undefined);
	const forceScrollId = React.useRef(0);
	const scrollDelayRef = React.useRef(0);
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
					if (mustScroll) {
						scrollTween.current = undefined;
					}
					if (lyricElement !== scrollTween.current?.lyricElement) {
						const listRect = lyricView.getBoundingClientRect();
						const lineRect = lyricElement.getBoundingClientRect();
						const lineHeight = lineRect.height;
						let scrollDelta = lineRect.top - listRect.top;
						if (!alignTopSelectedLyric) {
							scrollDelta -=
								(window.innerHeight - lineHeight) / 2 - listRect.top;
						} else if (lyricElement.innerText.trim().length > 0) {
							scrollDelta -= listRect.height * 0.1;
						} else {
							scrollDelta -= window.innerHeight * 0.06 + listRect.height * 0.1;
						}
						const prevScrollTop = lyricView.scrollTop;
						const obj = {
							scrollTop: prevScrollTop,
						};

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
									if (!alignTopSelectedLyric) {
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
								.to(
									{
										scrollTop: prevScrollTop + scrollDelta,
									},
									750,
								)
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

	React.useEffect(() => {
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
			console.log(evt.button);
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
		return () => {
			lastIndex.current = currentLyricIndex;
		};
	}, [currentLyricIndex]);

	React.useEffect(() => {
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
		scrollDelayRef.current = 0;
		keepSelectLyrics.current.clear();
	}, [
		configTranslatedLyric,
		configDynamicLyric,
		configRomanLyric,
		currentLyrics,
	]);

	const onLyricScroll = (_evt: React.MouseEvent) => {
		scrollDelayRef.current = Date.now();
	};

	const mapCurrentLyrics = React.useCallback(
		(line: LyricLine, index: number, _lines: LyricLine[]) => {
			let isTooFast = keepSelectLyrics.current.has(index); // 如果歌词太快，我们就缓和一下
			const offset = index - currentLyricIndex;
			if (line.originalLyric.trim().length > 0) {
				return (
					<LyricLineView
						key={`${index}-${line.time}-${line.originalLyric}`}
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
						key={`${index}-dots`}
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

	return (
		<div className="am-lyric-view" onWheel={onLyricScroll}>
			<div ref={lyricListElement}>{currentLyrics?.map(mapCurrentLyrics)}</div>
		</div>
	);
};

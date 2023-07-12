import { useAtomValue, useSetAtom } from "jotai";
import { LyricLineTransform, LyricRendererContext } from ".";
import { classname } from "../../api";
import { useConfigValueBoolean } from "../../api/react";
import { LyricLine } from "../../core/lyric-parser";
import { playProgressAtom, rightClickedLyricAtom } from "../../core/states";
import * as React from "react";
import type { DynamicLyricWord } from "../../core/lyric-types";
import { useSpring } from "../../utils/spring-svelte";
import { log, warn } from "../../utils/logger";

const LYRIC_WORD_GLOW_ANIMATION: Keyframe[] = [
	{
		offset: 0,
		transform: "translate3d(0, 0px, 0px)",
		opacity: 0.5,
		filter:
			"drop-shadow(0 0 0 var(--applemusic-like-lyrics-font-color, white))",
	},
	{
		offset: 0.5,
		transform: "translate3d(0, -1px, 20px)",
		opacity: 1,
		filter:
			"drop-shadow(0 0 4px var(--applemusic-like-lyrics-font-color, white))",
	},
	{
		offset: 1,
		transform: "translate3d(0, 0px, 0)",
		opacity: 1,
		filter:
			"drop-shadow(0 0 0 var(--applemusic-like-lyrics-font-color, white))",
	},
];

function generateFadeGradient(width: number): [string, number, number] {
	const totalAspect = 2 + width;
	const widthInTotal = width / totalAspect;
	const leftPos = (1 - widthInTotal) / 2;
	return [
		`linear-gradient(to right, rgba(0,0,0,1) ${
			leftPos * 100
		}%, rgba(0,0,0,0.5) ${(leftPos + widthInTotal) * 100}%)`,
		widthInTotal,
		totalAspect,
	];
}

const LyricWord: React.FC<{
	word: DynamicLyricWord;
	delay: number;
	index: number;
	selected: boolean;
}> = ({ word, delay, index, selected }) => {
	const duration = Math.max(1000, Math.min(2500, word.duration));
	const letters = React.useMemo(() => word.word.split(""), [word.word]);
	const letterDuration = duration / letters.length / 2;
	const floatDuration = Math.max(1000, word.duration);
	const wordRef = React.useRef<HTMLSpanElement>(null);
	const glowWordRef = React.useRef<HTMLSpanElement>(null);
	const playProgress = useAtomValue(playProgressAtom);
	const curTimeRef = React.useRef(playProgress);
	const wordFloatAnimationRef = React.useRef<Animation>();
	const wordMainAnimationRef = React.useRef<Animation[]>([]);
	// 悬浮效果
	React.useLayoutEffect(() => {
		if (
			!wordFloatAnimationRef.current &&
			(wordRef.current || glowWordRef.current)
		) {
			try {
				const a = (wordRef.current ?? glowWordRef.current)?.animate(
					[
						{
							transform: "translateY(0px)",
						},
						{
							transform: "translateY(-2px)",
						},
					],
					{
						duration: floatDuration,
						delay,
						id: "float-word",
						composite: "add",
						fill: "both",
					},
				);
				a?.pause();
				wordFloatAnimationRef.current = a;
			} catch (err) {
				warn("应用单词悬浮动画失败", err);
			}
		}
	}, [floatDuration]);
	React.useEffect(() => {
		curTimeRef.current = playProgress * 1000;
	}, [playProgress]);
	// 渐变效果或发光效果
	React.useLayoutEffect(() => {
		if (word.shouldGlow && glowWordRef.current) {
			wordMainAnimationRef.current.forEach((a) => {
				a.finish();
				a.cancel();
			});
			wordMainAnimationRef.current.splice(
				0,
				wordMainAnimationRef.current.length,
			);
			let i = 0;
			for (const letter of glowWordRef.current.children) {
				const a = letter.animate(LYRIC_WORD_GLOW_ANIMATION, {
					duration: duration - i * letterDuration,
					delay: delay + i * letterDuration,
					id: "glow-word",
					easing: "ease-in-out",
					composite: "add",
					fill: "both",
				});
				a.pause();
				wordMainAnimationRef.current.push(a);
				i++;
			}
		} else if (wordRef.current) {
			wordMainAnimationRef.current.forEach((a) => {
				a.finish();
				a.cancel();
			});
			wordMainAnimationRef.current.splice(
				0,
				wordMainAnimationRef.current.length,
			);
			let canceled = false;
			const width = wordRef.current.clientWidth;
			const fadeWidth = 32 / width;
			// 我们生成一个对称的渐变图像
			// [---空白---][渐变][---空白---]
			const [maskImage, widthInTotal, totalAspect] =
				generateFadeGradient(fadeWidth);
			wordRef.current.style.maskImage = maskImage;
			wordRef.current.style.webkitMaskImage = maskImage;
			wordRef.current.style.maskRepeat = "no-repeat";
			wordRef.current.style.maskSize = `${totalAspect * 100}% 100%`;
			wordRef.current.style.webkitMaskSize = "200% 100%";
			wordRef.current.style.willChange = "mask-position, -webkit-mask-position";
			const onFrame = () => {
				if (wordRef.current && !canceled) {
					const i =
						Math.min(
							1,
							Math.max(
								0,
								1 +
									widthInTotal -
									((curTimeRef.current - word.time) / duration) *
										(1 + widthInTotal),
							),
						) * width;
					const maskPos = `${-i}px 0px`;
					wordRef.current.style.webkitMaskPosition = maskPos;
					wordRef.current.style.maskPosition = maskPos;
					requestAnimationFrame(onFrame);
				}
			};
			onFrame();
			return () => {
				canceled = true;
				if (wordRef.current) {
					wordRef.current.style.maskImage = "";
					wordRef.current.style.webkitMaskImage = "";
					wordRef.current.style.maskRepeat = "";
					wordRef.current.style.maskSize = "";
					wordRef.current.style.webkitMaskSize = "";
				}
			};
		}
	}, [
		word.duration,
		word.shouldGlow,
		delay,
		letterDuration,
		glowWordRef.current,
		wordRef.current,
	]);
	// 播放动画
	React.useLayoutEffect(() => {
		if (wordRef.current || glowWordRef.current) {
			if (selected) {
				if (wordFloatAnimationRef.current) {
					wordFloatAnimationRef.current.updatePlaybackRate(1);
					wordFloatAnimationRef.current.play();
				}
				wordMainAnimationRef.current.forEach((a) => {
					a.playbackRate = 1;
					a.play();
				});
			} else {
				if (wordFloatAnimationRef.current) {
					wordFloatAnimationRef.current.updatePlaybackRate(-1);
					wordFloatAnimationRef.current.play();
				}
				wordMainAnimationRef.current.forEach((a) => {
					a.playbackRate = -1;
					if (a.playState === "finished") {
						a.play();
					}
				});
			}
		}
	}, [selected]);
	if (word.shouldGlow) {
		return (
			<span className="am-lyric-glow-word" ref={glowWordRef}>
				{letters.map((v) => (
					<span>{v}</span>
				))}
			</span>
		);
	} else {
		return (
			<span
				key={`am-lyric-real-word dynamic-word-${word.word}-${index}`}
				ref={wordRef}
			>
				{word.word}
			</span>
		);
	}
};

export const LyricLineView: React.FC<
	{
		offset: number;
		selected: boolean;
		line: LyricLine;
		dynamic: boolean;
		translated: boolean;
		roman: boolean;
		lineTransform: LyricLineTransform;
		onSizeChanged: () => void;
		onClickLyric?: (line: LyricLine, evt: React.MouseEvent) => void;
	} & React.HTMLAttributes<HTMLDivElement>
> = ({
	offset,
	selected,
	line,
	dynamic,
	translated,
	roman,
	lineTransform,
	onSizeChanged,
	onClickLyric,
	...props
}) => {
	const setRightClickedLyric = useSetAtom(rightClickedLyricAtom);
	const forceDynamic = useConfigValueBoolean("forceDynamicLyric", false);
	const lineRef = React.useRef<HTMLDivElement>(null);

	const lyricCtx = React.useContext(LyricRendererContext);
	const lyricViewSizeRef = React.useRef(lyricCtx.lyricPageSize);
	const selfSizeRef = React.useRef([0, 0]);
	const visibilityRef = React.useRef("");
	const [shouldKeepDynamic, setShouldKeepDynamic] = React.useState(selected);

	React.useLayoutEffect(() => {
		const line = lineRef.current;
		if (line) {
			let lastWidth = line.clientWidth;
			let lastHeight = line.clientHeight;
			selfSizeRef.current = [lastWidth, lastHeight];
			const obs = new ResizeObserver(() => {
				const width = line.clientWidth;
				const height = line.clientHeight;
				if (height !== lastHeight || width !== lastWidth) {
					lastWidth = width;
					lastHeight = height;
					selfSizeRef.current = [width, height];
					onSizeChanged();
				}
			});
			obs.observe(line);
			return () => {
				obs.disconnect();
			};
		}
	}, [onSizeChanged]);

	React.useLayoutEffect(() => {
		setShouldKeepDynamic((v) => v || selected);
	}, [selected]);

	React.useLayoutEffect(() => {
		if (lineRef.current) {
			lineRef.current.style.visibility = "hidden";
		}
	}, [lineRef.current]);

	React.useEffect(() => {
		lyricViewSizeRef.current = lyricCtx.lyricPageSize;
	}, [lyricCtx.lyricPageSize]);

	const lastLineTransformRef = React.useRef(lineTransform);
	const springRef = useSpring(
		{
			top: lineTransform.top,
			left: lineTransform.left,
			scale: lineTransform.scale,
		},
		{
			stiffness: 0.1,
			damping: 1,
			precision: 0.001,
		},
		(value) => {
			const line = lineRef.current;
			lastLineTransformRef.current.left = value.left;
			lastLineTransformRef.current.top = value.top;
			lastLineTransformRef.current.scale = value.scale;
			if (line) {
				const { top, left, scale } = value;
				const isOutOfSight =
					top > lyricViewSizeRef.current[1] ||
					top < -selfSizeRef.current[1] ||
					left > lyricViewSizeRef.current[0] ||
					left < -selfSizeRef.current[0];
				if (isOutOfSight) {
					if (visibilityRef.current !== "hidden") {
						lineRef.current.style.visibility = "hidden";
						lineRef.current.style.transform = "translateY(-512px) scale(0)";
						visibilityRef.current = "hidden";
					}
				} else {
					lineRef.current.style.transform = `translateY(${top}px) translateX(${left}px) scale(${scale})`;
					if (visibilityRef.current !== "") {
						lineRef.current.style.visibility = "";
						visibilityRef.current = "";
					}
				}
			}
		},
	);

	React.useEffect(() => {
		if (!lineTransform.initialized && lineRef.current) {
			if (visibilityRef.current !== "hidden") {
				lineRef.current.style.visibility = "hidden";
				visibilityRef.current = "hidden";
			}
		}
		const { top, left } = lineTransform;
		const { top: curTop, left: curLeft } = lastLineTransformRef.current;
		const isTargetOutOfSight =
			top > lyricViewSizeRef.current[1] ||
			top < -selfSizeRef.current[1] ||
			left > lyricViewSizeRef.current[0] ||
			left < -selfSizeRef.current[0];
		const currentOutOfSight =
			curTop > lyricViewSizeRef.current[1] ||
			curTop < -selfSizeRef.current[1] ||
			curLeft > lyricViewSizeRef.current[0] ||
			curLeft < -selfSizeRef.current[0];
		if (isTargetOutOfSight && currentOutOfSight) {
			if (visibilityRef.current !== "hidden" && lineRef.current) {
				lineRef.current.style.visibility = "hidden";
				lineRef.current.style.transform = "translateY(-512px) scale(0)";
				visibilityRef.current = "hidden";
			}
			springRef.current
				.set(
					{
						top: lineTransform.top,
						left: lineTransform.left,
						scale: lineTransform.scale,
					},
					{
						hard: true,
					},
				)
				.then(() => {
					if (lineRef.current)
						lineRef.current.style.transform = `translateY(${lineTransform.top}px) translateX(${lineTransform.left}px) scale(${lineTransform.scale})`;
					setShouldKeepDynamic(false);
				});
			return () => {
				setShouldKeepDynamic(false);
			};
		} else {
			const h = setTimeout(() => {
				springRef.current
					.set(
						{
							top: lineTransform.top,
							left: lineTransform.left,
							scale: lineTransform.scale,
						},
						{
							hard: !lineTransform.initialized || lineTransform.userScrolling,
							soft: 0.5,
						},
					)
					.then(() => {
						if (lineRef.current)
							lineRef.current.style.transform = `translateY(${lineTransform.top}px) translateX(${lineTransform.left}px) scale(${lineTransform.scale})`;
						setShouldKeepDynamic(false);
					});
			}, lineTransform.delay);
			return () => {
				clearTimeout(h);
				setShouldKeepDynamic(false);
			};
		}
	}, [lineTransform]);

	return (
		<div
			onClick={(evt) => {
				if (onClickLyric) onClickLyric(line, evt);
			}}
			onContextMenu={(evt) => {
				setRightClickedLyric(line);
				evt.preventDefault();
			}}
			className={classname("am-lyric-line", {
				"am-lyric-line-before": offset < 0,
				"am-lyric-line-after": offset > 0,
				"am-lyric-line-selected": selected,
				"am-lyric-line-align-right": !!line.shouldAlignRight,
				"am-lyric-line-bg-lyric": !!line.isBackgroundLyric,
				[`am-lyric-line-o${offset}`]: Math.abs(offset) < 10,
			})}
			// style={{
			// 	display: Math.abs(offset) > 25 ? "none" : "",
			// }}
			ref={lineRef}
			{...props}
		>
			<div>
				{dynamic &&
				line.dynamicLyric &&
				line.dynamicLyricTime &&
				(selected ||
					shouldKeepDynamic ||
					forceDynamic ||
					Math.abs(offset) < 20) ? (
					<div className="am-lyric-line-dynamic">
						{line.dynamicLyric.map((word, i) => (
							<LyricWord
								word={word}
								delay={word.time - (line.dynamicLyricTime || 0)}
								index={i}
								selected={selected}
							/>
						))}
					</div>
				) : (
					<div className="am-lyric-line-original">
						{line.dynamicLyric
							?.map((v) => v.word)
							.join("")
							.trim() || line.originalLyric}
					</div>
				)}
				{lyricCtx.reverseLyricOrder ? (
					<>
						<div className="am-lyric-line-roman">
							{roman ? line.romanLyric : ""}
						</div>
						<div className="am-lyric-line-translated">
							{translated ? line.translatedLyric : ""}
						</div>
					</>
				) : (
					<>
						<div className="am-lyric-line-translated">
							{translated ? line.translatedLyric : ""}
						</div>
						<div className="am-lyric-line-roman">
							{roman ? line.romanLyric : ""}
						</div>
					</>
				)}
			</div>
		</div>
	);
};

import { useSetAtom } from "jotai";
import { LyricLineTransform } from ".";
import { classname } from "../../api";
import { useConfigValueBoolean } from "../../api/react";
import { LyricLine } from "../../core/lyric-parser";
import { rightClickedLyricAtom } from "../../core/states";
import * as React from "react";
import { DynamicLyricWord } from "../../core/lyric-types";

const LyricWord: React.FC<{
	word: DynamicLyricWord;
	delay: number;
	index: number;
}> = ({ word, delay, index }) => {
	if (word.shouldGlow) {
		const duration = Math.max(1000, Math.min(2500, word.duration));
		const letters = React.useMemo(() => word.word.split(""), [word.word]);
		const letterDuration = duration / letters.length / 2;

		return (
			<span
				className="am-lyric-glow-word"
				style={{
					animationDelay: `${delay}ms`,
					animationDuration: `${duration}ms`,
				}}
			>
				{letters.map((v, i) => (
					<span
						style={{
							animationDelay: `${delay + i * letterDuration}ms`,
							animationDuration: `${duration - i * letterDuration}ms`,
						}}
					>
						{v}
					</span>
				))}
			</span>
		);
	} else {
		return (
			<span
				key={`am-lyric-real-word dynamic-word-${word.word}-${index}`}
				style={{
					animationDelay: `${delay}ms`,
					animationDuration: `${word.duration}ms`,
				}}
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

	React.useLayoutEffect(() => {
		const line = lineRef.current;
		if (line) {
			let lastWidth = line.clientWidth;
			let lastHeight = line.clientHeight;
			const obs = new ResizeObserver(() => {
				const width = line.clientWidth;
				const height = line.clientHeight;
				if (height !== lastHeight || width !== lastWidth) {
					lastWidth = width;
					lastHeight = height;
					onSizeChanged();
				}
			});
			obs.observe(line);
			return () => {
				obs.disconnect();
			};
		}
	}, [onSizeChanged]);

	const prevTransform = React.useRef(
		`translateY(${lineTransform.top}px) translateX(${lineTransform.left}) scale(${lineTransform.scale})`,
	);
	const prevTransformTop = React.useRef(lineTransform.top);
	const prevTransformUserScrolling = React.useRef(lineTransform.userScrolling);
	React.useEffect(() => {
		const line = lineRef.current;
		if (line) {
			if (prevTransformUserScrolling.current !== lineTransform.userScrolling) {
				if (lineTransform.userScrolling) {
					line.style.transition = "all 0.25s";
				} else {
					line.style.transition = "";
				}
				prevTransformUserScrolling.current = lineTransform.userScrolling;
			}
			const dest = `translateY(${lineTransform.top.toFixed(
				3,
			)}px) translateX(${lineTransform.left.toFixed(
				3,
			)}) scale(${lineTransform.scale.toFixed(3)})`;
			if (lineTransform.userScrolling) {
				line.style.transform = dest;
				return () => {
					prevTransform.current = dest;
					prevTransformTop.current = lineTransform.top;
				};
			} else {
				let canceled = false;

				const animations: Animation[] = [];

				if (lineTransform.duration > 0) {
					(async () => {
						const animateTime = Math.max(0, lineTransform.duration * 0.7);
						const bounceTime = Math.max(0, lineTransform.duration * 0.3);

						const middle =
							prevTransformTop.current === lineTransform.top
								? dest
								: `translateY(${(lineTransform.top - 2).toFixed(
										3,
								  )}px) translateX(${lineTransform.left.toFixed(
										3,
								  )}) scale(${lineTransform.scale.toFixed(3)})`;

						let animation: Animation;

						animation = line.animate(
							[
								{
									transform: prevTransform.current,
								},
								{
									transform: middle,
								},
							],
							{
								easing: "cubic-bezier(0.46, 0, 0.07, 1)",
								delay: lineTransform.delay,
								fill: "backwards",
								duration: animateTime,
							},
						);
						animations.push(animation);
						await animation.finished;

						if (canceled) return;
						animation = line.animate(
							[
								{
									transform: middle,
								},
								{
									transform: dest,
								},
							],
							{
								easing: "ease-in-out",
								fill: "forwards",
								duration: bounceTime,
							},
						);
						animations.push(animation);
						await animation.finished;

						if (canceled) return;
						line.style.transform = dest;
					})();
				} else {
					line.style.transform = dest;
				}

				return () => {
					prevTransform.current = dest;
					prevTransformTop.current = lineTransform.top;
					canceled = true;
					animations.forEach((a) => {
						try {
							a.finish();
						} catch {}
						try {
							a.cancel();
						} catch {}
					});
					line.style.transform = dest;
				};
			}
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
				(selected || forceDynamic || Math.abs(offset) < 5) ? (
					<div className="am-lyric-line-dynamic">
						{line.dynamicLyric.map((word, i) => (
							<LyricWord
								word={word}
								delay={word.time - (line.dynamicLyricTime || 0)}
								index={i}
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
				<div className="am-lyric-line-translated">
					{translated ? line.translatedLyric : ""}
				</div>
				<div className="am-lyric-line-roman">
					{roman ? line.romanLyric : ""}
				</div>
			</div>
		</div>
	);
};

import { useAtomValue, useSetAtom } from "jotai";
import { LyricLineTransform } from ".";
import { classname, PlayState } from "../../api";
import { useConfigValueBoolean } from "../../api/react";
import { LyricLine } from "../../core/lyric-parser";
import { playStateAtom, rightClickedLyricAtom } from "../../core/states";
import * as React from "react";
import { DynamicLyricWord } from "../../core/lyric-types";

const LyricWord: React.FC<{
	word: DynamicLyricWord;
	playState: PlayState;
	delay: number;
	index: number;
}> = ({ word, playState, delay, index }) => {
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
					animationPlayState:
						playState === PlayState.Pausing ? "paused" : undefined,
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
	const playState = useAtomValue(playStateAtom);
	const setRightClickedLyric = useSetAtom(rightClickedLyricAtom);
	const forceDynamic = useConfigValueBoolean("forceDynamicLyric", false);
	const lineRef = React.useRef<HTMLDivElement>(null);

	React.useLayoutEffect(() => {
		const dots = lineRef.current;
		if (dots) {
			const obs = new ResizeObserver(onSizeChanged);
			obs.observe(dots);
			return () => {
				obs.disconnect();
			};
		}
	}, []);

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
				[`am-lyric-line-o${offset}`]: Math.abs(offset) < 5,
			})}
			style={{
				transform: `translateY(${lineTransform.top}px) translateX(${lineTransform.left}) scale(${lineTransform.scale})`,
				transitionDelay: `${lineTransform.delay}ms`,
				transitionDuration: `${lineTransform.duration}ms`,
				display: Math.abs(offset) > 25 ? "none" : "",
			}}
			ref={lineRef}
			{...props}
		>
			{dynamic &&
			line.dynamicLyric &&
			line.dynamicLyricTime &&
			(selected || forceDynamic || Math.abs(offset) < 5) ? (
				<div className="am-lyric-line-dynamic">
					{line.dynamicLyric.map((word, i) => (
						<LyricWord
							word={word}
							playState={playState}
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
			<div className="am-lyric-line-roman">{roman ? line.romanLyric : ""}</div>
		</div>
	);
};

import { useAtomValue, useSetAtom } from "jotai";
import { classname, PlayState } from "../../api";
import { useConfigValueBoolean } from "../../api/react";
import { LyricLine } from "../../core/lyric-parser";
import { playStateAtom, rightClickedLyricAtom } from "../../core/states";

export const LyricLineView: React.FC<{
	offset: number;
	selected: boolean;
	line: LyricLine;
	dynamic: boolean;
	translated: boolean;
	roman: boolean;
	onClickLyric?: (line: LyricLine, evt: React.MouseEvent) => void;
}> = (props) => {
	const playState = useAtomValue(playStateAtom);
	const setRightClickedLyric = useSetAtom(rightClickedLyricAtom);
	const forceDynamic = useConfigValueBoolean("forceDynamicLyric", false);
	return (
		// rome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			onClick={(evt) => {
				if (props.onClickLyric) props.onClickLyric(props.line, evt);
			}}
			onContextMenu={(evt) => {
				setRightClickedLyric(props.line);
				evt.preventDefault();
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
			props.line.dynamicLyricTime &&
			(props.selected || forceDynamic || Math.abs(props.offset) < 5) ? (
				<div className="am-lyric-line-dynamic">
					{props.line.dynamicLyric.map((word, i) => (
						<span key={`dynamic-word-${word.word}-${i}`}>
							<span
								style={{
									animationDelay: `${
										word.time - (props.line.dynamicLyricTime || 0)
									}ms`,
									animationDuration: `${word.duration}ms`,
									animationPlayState:
										playState === PlayState.Pausing ? "paused" : undefined,
								}}
								className="am-lyric-real-word"
							>
								{word.word}
							</span>
							<span
								style={{
									animationDelay: `${
										word.time - (props.line.dynamicLyricTime || 0)
									}ms`,
									animationDuration: `${word.duration}ms`,
									animationPlayState:
										playState === PlayState.Pausing ? "paused" : undefined,
								}}
								className="am-lyric-fake-word"
							>
								{word.word}
							</span>
						</span>
					))}
				</div>
			) : (
				<div className="am-lyric-line-original">
					{props.line.dynamicLyric
						?.map((v) => v.word)
						.join("")
						.trim() || props.line.originalLyric}
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
};

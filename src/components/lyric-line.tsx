import { classname } from "../api";
import { LyricLine } from "../core/lyric-parser";

export const LyricLineView: React.FC<{
	offset: number;
	selected: boolean;
	line: LyricLine;
	dynamic: boolean;
	translated: boolean;
	roman: boolean;
	onClickLyric?: (line: LyricLine) => void;
}> = (props) => {
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
			props.line.dynamicLyricTime &&
			(props.selected || Math.abs(props.offset) === 1) ? (
				<div className="am-lyric-line-dynamic">
					{props.line.dynamicLyric.map((word, i) => (
						// rome-ignore lint/suspicious/noArrayIndexKey: <explanation>
						<span key={i}>
							<span
								style={{
									animationDelay: `${
										word.time - (props.line.dynamicLyricTime || 0)
									}ms`,
									animationDuration: `${word.duration}ms`,
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
								}}
								className="am-lyric-fake-word"
							>
								{word.word}
							</span>
						</span>
					))}
				</div>
			) : (
				<div className="am-lyric-line-original">{props.line.originalLyric}</div>
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

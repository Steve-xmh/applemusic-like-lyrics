import { PlayState } from "../api";
import { LyricLine } from "../core/lyric-parser";

export interface LyricRendererProps {
	lyrics: LyricLine[];
	selected: number;
	playState: PlayState;
	onLyricLineClicked: (
		lyricLine: LyricLine,
		index: number,
		evt: MouseEvent,
	) => void;
}

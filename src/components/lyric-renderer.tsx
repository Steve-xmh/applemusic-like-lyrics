import { PlayState } from "../api";
import { LyricLine } from "../core/lyric-parser";
import { LyricDOMRenderer } from "./lyric-dom-renderer";

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

export enum RendererBackend {
	DOM = "DOM",
	Canvas = "CANVAS",
}

export const LyricRenderer: React.FC<{
	backend: RendererBackend;
}> = (props) => {
	switch (props.backend) {
		case RendererBackend.DOM:
			return <LyricDOMRenderer />;
		default:
			return (
				<div className="am-lyric-view">
					<div>
						<div>错误：未知的渲染后端类型：{props.backend}</div>
					</div>
				</div>
			);
	}
};

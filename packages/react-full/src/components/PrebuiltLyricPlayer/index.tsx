/**
 * @fileoverview
 * 已经部署好所有组件的歌词播放器组件，在正确设置所有的 Jotai 状态后可以开箱即用
 */

import { LyricPlayer } from "@applemusic-like-lyrics/react";
import { AutoLyricLayout } from "../../layout/auto";
import { ControlThumb } from "../ControlThumb";
import { Cover } from "../Cover";
import "@applemusic-like-lyrics/core/style.css";
import { useAtomValue } from "jotai";
import { musicLyricLinesAtom } from "../../states/music";
import { HTMLProps } from "react";

/**
 * 已经部署好所有组件的歌词播放器组件，在正确设置所有的 Jotai 状态后可以开箱即用
 */
export const PrebuiltLyricPlayer: React.FC<HTMLProps<HTMLDivElement>> = ({
	...rest
}) => {
	const lyricLines = useAtomValue(musicLyricLinesAtom);

	return (
		<AutoLyricLayout
			coverSlot={<Cover />}
			thumbSlot={<ControlThumb />}
			lyricSlot={
				<LyricPlayer
					style={{ width: "100%", height: "100%" }}
					lyricLines={lyricLines}
				/>
			}
			{...rest}
		/>
	);
};

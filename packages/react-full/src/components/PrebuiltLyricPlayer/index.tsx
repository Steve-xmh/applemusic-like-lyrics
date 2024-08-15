/**
 * @fileoverview
 * 已经部署好所有组件的歌词播放器组件，在正确设置所有的 Jotai 状态后可以开箱即用
 */

import { LyricPlayer } from "@applemusic-like-lyrics/react";
import { AutoLyricLayout } from "../../layout/auto";
import { ControlThumb } from "../ControlThumb";
import { Cover } from "../Cover";
import styles from "./index.module.css";
import "@applemusic-like-lyrics/core/style.css";
import { useAtomValue } from "jotai";
import {
	hideVerticalLyricViewAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicLyricLinesAtom,
	musicNameAtom,
} from "../../states/music";
import type { FC, HTMLProps } from "react";
import { MusicInfo } from "../MusicInfo";
import { BouncingSlider } from "../BouncingSlider";
import { VolumeControl } from "../VolumeControlSlider";

const PrebuiltMusicInfo: FC<{
	className?: string;
	style?: React.CSSProperties;
}> = ({ className, style }) => {
	const musicName = useAtomValue(musicNameAtom);
	const musicArtists = useAtomValue(musicArtistsAtom);
	const musicAlbum = useAtomValue(musicAlbumNameAtom);
	return (
		<MusicInfo
			className={className}
			style={style}
			name={musicName}
			artists={musicArtists.map((v) => v.name)}
			album={musicAlbum}
		/>
	);
};

/**
 * 已经部署好所有组件的歌词播放器组件，在正确设置所有的 Jotai 状态后可以开箱即用
 */
export const PrebuiltLyricPlayer: FC<HTMLProps<HTMLDivElement>> = ({
	...rest
}) => {
	const lyricLines = useAtomValue(musicLyricLinesAtom);
	const hideVerticalLyricView = useAtomValue(hideVerticalLyricViewAtom);

	return (
		<AutoLyricLayout
			coverSlot={<Cover />}
			thumbSlot={<ControlThumb />}
			smallControlsSlot={<PrebuiltMusicInfo />}
			bigControlsSlot={
				<>
					<PrebuiltMusicInfo
						style={{
							paddingBottom: "2em",
						}}
					/>
					<BouncingSlider value={0.5} min={0} max={1} />
					<VolumeControl value={0.5} min={0} max={1} />
				</>
			}
			controlsSlot={
				<>
					<PrebuiltMusicInfo className={styles.horizontalControls} />
					<BouncingSlider value={0.5} min={0} max={1} />
					<VolumeControl value={0.5} min={0} max={1} />
				</>
			}
			lyricSlot={
				<LyricPlayer
					style={{ width: "100%", height: "100%" }}
					lyricLines={lyricLines}
				/>
			}
			hideLyric={hideVerticalLyricView}
			{...rest}
		/>
	);
};

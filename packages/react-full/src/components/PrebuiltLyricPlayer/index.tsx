/**
 * @fileoverview
 * 已经部署好所有组件的歌词播放器组件，在正确设置所有的 Jotai 状态后可以开箱即用
 */

import { LyricPlayer, BackgroundRender } from "@applemusic-like-lyrics/react";
import { AutoLyricLayout } from "../../layout/auto";
import { ControlThumb } from "../ControlThumb";
import { Cover } from "../Cover";
import "./icon-animations.css";
import styles from "./index.module.css";
import "@applemusic-like-lyrics/core/style.css";
import { useAtomValue } from "jotai";
import {
	AudioQualityType,
	hideLyricViewAtom,
	lowFreqVolumeAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicCoverAtom,
	musicCoverIsVideoAtom,
	musicDurationAtom,
	musicLyricLinesAtom,
	musicNameAtom,
	musicPlayingAtom,
	musicPlayingPositionAtom,
	musicQualityAtom,
} from "../../states/music";
import {
	onClickControlThumbAtom,
	onPlayOrResumeAtom,
	onRequestNextSongAtom,
	onRequestOpenMenuAtom,
	onRequestPrevSongAtom,
	onSeekPositionAtom,
} from "../../states/callback";
import { useRef, type FC, type HTMLProps } from "react";
import { MusicInfo } from "../MusicInfo";
import { BouncingSlider } from "../BouncingSlider";
import { VolumeControl } from "../VolumeControlSlider";

import IconRewind from "./icon_rewind.svg?react";
import IconForward from "./icon_forward.svg?react";
import IconPause from "./icon_pause.svg?react";
import IconPlay from "./icon_play.svg?react";
import { MediaButton } from "../MediaButton";
import { AudioQualityTag } from "../AudioQualityTag";
import classNames from "classnames";
import {
	lyricBackgroundFPSAtom,
	lyricBackgroundRenderScaleAtom,
} from "../../states/config";

const PrebuiltMusicInfo: FC<{
	className?: string;
	style?: React.CSSProperties;
}> = ({ className, style }) => {
	const musicName = useAtomValue(musicNameAtom);
	const musicArtists = useAtomValue(musicArtistsAtom);
	const musicAlbum = useAtomValue(musicAlbumNameAtom);
	const onMenuClicked = useAtomValue(onRequestOpenMenuAtom).onEmit;
	return (
		<MusicInfo
			className={className}
			style={style}
			name={musicName}
			artists={musicArtists.map((v) => v.name)}
			album={musicAlbum}
			onMenuButtonClicked={onMenuClicked}
		/>
	);
};

const PrebuiltMediaButtons: FC = () => {
	const musicIsPlaying = useAtomValue(musicPlayingAtom);
	const onRequestPrevSong = useAtomValue(onRequestPrevSongAtom).onEmit;
	const onRequestNextSong = useAtomValue(onRequestNextSongAtom).onEmit;
	const onPlayOrResume = useAtomValue(onPlayOrResumeAtom).onEmit;
	return (
		<>
			<MediaButton
				className={styles.songMediaButton}
				onClick={onRequestPrevSong}
			>
				<IconRewind color="#FFFFFF" />
			</MediaButton>
			<MediaButton
				className={styles.songMediaPlayButton}
				onClick={onPlayOrResume}
			>
				{musicIsPlaying ? (
					<IconPause color="#FFFFFF" />
				) : (
					<IconPlay color="#FFFFFF" />
				)}
			</MediaButton>
			<MediaButton
				className={styles.songMediaButton}
				onClick={onRequestNextSong}
			>
				<IconForward color="#FFFFFF" />
			</MediaButton>
		</>
	);
};

function toDuration(duration: number) {
	const isRemainTime = duration < 0;

	const d = Math.abs(duration | 0);
	const sec = d % 60;
	const min = Math.floor((d - sec) / 60);
	const secText = "0".repeat(2 - sec.toString().length) + sec;

	return `${isRemainTime ? "-" : ""}${min}:${secText}`;
}

const PrebuiltProgressBar: FC = () => {
	const musicDuration = useAtomValue(musicDurationAtom);
	const musicPosition = useAtomValue(musicPlayingPositionAtom);
	const musicQuality = useAtomValue(musicQualityAtom);
	const onSeekPosition = useAtomValue(onSeekPositionAtom).onEmit;

	return (
		<>
			<BouncingSlider
				value={musicPosition}
				min={0}
				max={musicDuration}
				onChange={onSeekPosition}
			/>
			<div className={styles.progressBarLabels}>
				<div>{toDuration(musicPosition / 1000)}</div>
				<div>
					<AudioQualityTag
						className={styles.qualityTag}
						quality={musicQuality}
					/>
				</div>
				<div>{toDuration((musicPosition - musicDuration) / 1000)}</div>
			</div>
		</>
	);
};

const PrebuiltVolumeControl: FC<{
	style?: React.CSSProperties;
}> = ({ style }) => {
	return <VolumeControl value={0.5} min={0} max={1} style={style} />;
};

/**
 * 已经部署好所有组件的歌词播放器组件，在正确设置所有的 Jotai 状态后可以开箱即用
 */
export const PrebuiltLyricPlayer: FC<HTMLProps<HTMLDivElement>> = ({
	...rest
}) => {
	const lyricLines = useAtomValue(musicLyricLinesAtom);
	const hideVerticalLyricView = useAtomValue(hideLyricViewAtom);
	const musicCover = useAtomValue(musicCoverAtom);
	const musicCoverIsVideo = useAtomValue(musicCoverIsVideoAtom);
	const musicIsPlaying = useAtomValue(musicPlayingAtom);
	const lowFreqVolume = useAtomValue(lowFreqVolumeAtom);
	const lyricBackgroundFPS = useAtomValue(lyricBackgroundFPSAtom);
	const lyricBackgroundRenderScale = useAtomValue(
		lyricBackgroundRenderScaleAtom,
	);
	const onClickControlThumb = useAtomValue(onClickControlThumbAtom).onEmit;

	const coverElRef = useRef<HTMLElement>(null);

	return (
		<AutoLyricLayout
			coverSlot={
				<Cover
					coverUrl={musicCover}
					ref={coverElRef}
					musicPaused={!musicIsPlaying}
				/>
			}
			thumbSlot={<ControlThumb onClick={onClickControlThumb} />}
			smallControlsSlot={
				<PrebuiltMusicInfo
					className={classNames(
						styles.smallMusicInfo,
						hideVerticalLyricView && styles.hideLyric,
					)}
				/>
			}
			backgroundSlot={
				<BackgroundRender
					album={musicCover}
					albumIsVideo={musicCoverIsVideo}
					lowFreqVolume={lowFreqVolume}
					renderScale={lyricBackgroundRenderScale}
					fps={lyricBackgroundFPS}
					style={{
						zIndex: -1,
					}}
				/>
			}
			bigControlsSlot={
				<>
					<PrebuiltMusicInfo
						className={classNames(
							styles.bigMusicInfo,
							hideVerticalLyricView && styles.hideLyric,
						)}
						style={{
							padding: "2em 0",
						}}
					/>
					<PrebuiltProgressBar />
					<div className={styles.bigControls}>
						<PrebuiltMediaButtons />
					</div>
					<PrebuiltVolumeControl style={{ paddingBottom: "4em" }} />
				</>
			}
			controlsSlot={
				<>
					<PrebuiltMusicInfo className={styles.horizontalControls} />
					<PrebuiltProgressBar />
					<div className={styles.controls}>
						<PrebuiltMediaButtons />
					</div>
					<PrebuiltVolumeControl />
				</>
			}
			lyricSlot={
				<LyricPlayer
					style={{ width: "100%", height: "100%" }}
					playing={musicIsPlaying}
					alignPosition={0.25}
					lyricLines={lyricLines}
				/>
			}
			hideLyric={hideVerticalLyricView}
			{...rest}
		/>
	);
};

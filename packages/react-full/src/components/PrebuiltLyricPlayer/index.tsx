/**
 * @fileoverview
 * 已经部署好所有组件的歌词播放器组件，在正确设置所有的 Jotai 状态后可以开箱即用
 */

import "@applemusic-like-lyrics/core/style.css";
import { BackgroundRender, LyricPlayer } from "@applemusic-like-lyrics/react";
import structuredClone from "@ungap/structured-clone";
import { useAtomValue } from "jotai";
import {
	type FC,
	type HTMLProps,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { AutoLyricLayout } from "../../layout/auto";
import {
	onChangeVolumeAtom,
	onClickControlThumbAtom,
	onPlayOrResumeAtom,
	onRequestNextSongAtom,
	onRequestOpenMenuAtom,
	onRequestPrevSongAtom,
	onSeekPositionAtom,
} from "../../states/callback";
import {
	fftDataAtom,
	hideLyricViewAtom,
	isLyricPageOpenedAtom,
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
	musicVolumeAtom,
} from "../../states/music";
import { BouncingSlider } from "../BouncingSlider";
import { ControlThumb } from "../ControlThumb";
import { Cover } from "../Cover";
import { MusicInfo } from "../MusicInfo";
import { VolumeControl } from "../VolumeControlSlider";
import "./icon-animations.css";
import styles from "./index.module.css";

import classNames from "classnames";
import {
	PlayerControlsType,
	enableLyricLineBlurEffectAtom,
	enableLyricLineScaleEffectAtom,
	enableLyricLineSpringAnimationAtom,
	enableLyricRomanLineAtom,
	enableLyricSwapTransRomanLineAtom,
	enableLyricTranslationLineAtom,
	lyricBackgroundFPSAtom,
	lyricBackgroundRenderScaleAtom,
	lyricBackgroundRendererAtom,
	lyricBackgroundStaticModeAtom,
	lyricWordFadeWidthAtom,
	playerControlsTypeAtom,
} from "../../states/config";
import { toDuration } from "../../utils";
import { AudioFFTVisualizer } from "../AudioFFTVisualizer";
import { AudioQualityTag } from "../AudioQualityTag";
import { MediaButton } from "../MediaButton";
import IconForward from "./icon_forward.svg?react";
import IconPause from "./icon_pause.svg?react";
import IconPlay from "./icon_play.svg?react";
import IconRewind from "./icon_rewind.svg?react";

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

const PrebuiltCoreLyricPlayer: FC<{
	alignPosition: number;
	alignAnchor: "center" | "bottom" | "top";
}> = ({ alignPosition, alignAnchor }) => {
	const musicIsPlaying = useAtomValue(musicPlayingAtom);
	const lyricLines = useAtomValue(musicLyricLinesAtom);
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);
	const musicPlayingPosition = useAtomValue(musicPlayingPositionAtom);

	const enableLyricLineBlurEffect = useAtomValue(enableLyricLineBlurEffectAtom);
	const enableLyricLineScaleEffect = useAtomValue(
		enableLyricLineScaleEffectAtom,
	);
	const enableLyricLineSpringAnimation = useAtomValue(
		enableLyricLineSpringAnimationAtom,
	);
	const lyricWordFadeWidth = useAtomValue(lyricWordFadeWidthAtom);
	const enableLyricTranslationLine = useAtomValue(
		enableLyricTranslationLineAtom,
	);
	const enableLyricRomanLine = useAtomValue(enableLyricRomanLineAtom);
	const enableLyricSwapTransRomanLine = useAtomValue(
		enableLyricSwapTransRomanLineAtom,
	);

	const processedLyricLines = useMemo(() => {
		const processed = structuredClone(lyricLines);
		if (!enableLyricTranslationLine) {
			for (const line of processed) {
				line.translatedLyric = "";
			}
		}
		if (!enableLyricRomanLine) {
			for (const line of processed) {
				line.romanLyric = "";
			}
		}
		if (enableLyricSwapTransRomanLine) {
			for (const line of processed) {
				[line.translatedLyric, line.romanLyric] = [
					line.romanLyric,
					line.translatedLyric,
				];
			}
		}
		return processed;
	}, [
		lyricLines,
		enableLyricTranslationLine,
		enableLyricRomanLine,
		enableLyricSwapTransRomanLine,
	]);

	return (
		<LyricPlayer
			style={{
				width: "100%",
				height: "100%",
				fontWeight: "var(--amll-lyric-font-weight, 500)",
			}}
			playing={musicIsPlaying}
			disabled={!isLyricPageOpened}
			alignPosition={alignPosition}
			alignAnchor={alignAnchor}
			currentTime={musicPlayingPosition}
			lyricLines={processedLyricLines}
			enableBlur={enableLyricLineBlurEffect}
			enableScale={enableLyricLineScaleEffect}
			enableSpring={enableLyricLineSpringAnimation}
			wordFadeWidth={lyricWordFadeWidth}
		/>
	);
};

const PrebuiltVolumeControl: FC<{
	style?: React.CSSProperties;
}> = ({ style }) => {
	const musicVolume = useAtomValue(musicVolumeAtom);
	const onChangeVolume = useAtomValue(onChangeVolumeAtom).onEmit;
	return (
		<VolumeControl
			value={musicVolume}
			min={0}
			max={1}
			style={style}
			onChange={onChangeVolume}
		/>
	);
};

const PrebuiltMusicControls: FC<HTMLProps<HTMLDivElement>> = ({
	className,
	...props
}) => {
	const playerControlsType = useAtomValue(playerControlsTypeAtom);
	const fftData = useAtomValue(fftDataAtom);
	return (
		<div className={classNames(styles.controls, className)} {...props}>
			{playerControlsType === PlayerControlsType.Controls && (
				<PrebuiltMediaButtons />
			)}
			{playerControlsType === PlayerControlsType.FFT && (
				<AudioFFTVisualizer
					style={{
						width: "100%",
						height: "8vh",
					}}
					fftData={fftData}
				/>
			)}
		</div>
	);
};

/**
 * 已经部署好所有组件的歌词播放器组件，在正确设置所有的 Jotai 状态后可以开箱即用
 */
export const PrebuiltLyricPlayer: FC<HTMLProps<HTMLDivElement>> = ({
	className,
	...rest
}) => {
	const hideVerticalLyricView = useAtomValue(hideLyricViewAtom);
	const musicCover = useAtomValue(musicCoverAtom);
	const musicCoverIsVideo = useAtomValue(musicCoverIsVideoAtom);
	const musicIsPlaying = useAtomValue(musicPlayingAtom);
	const lowFreqVolume = useAtomValue(lowFreqVolumeAtom);
	const lyricBackgroundFPS = useAtomValue(lyricBackgroundFPSAtom);
	const lyricBackgroundStaticMode = useAtomValue(lyricBackgroundStaticModeAtom);
	const lyricBackgroundRenderScale = useAtomValue(
		lyricBackgroundRenderScaleAtom,
	);
	const onClickControlThumb = useAtomValue(onClickControlThumbAtom).onEmit;
	const [isVertical, setIsVertical] = useState(false);
	const [alignPosition, setAlignPosition] = useState(0.25);
	const [alignAnchor, setAlignAnchor] = useState<"center" | "bottom" | "top">(
		"top",
	);
	const coverElRef = useRef<HTMLElement>(null);
	const layoutRef = useRef<HTMLDivElement>(null);
	const backgroundRenderer = useAtomValue(lyricBackgroundRendererAtom);

	useLayoutEffect(() => {
		// 如果是水平布局，则让歌词对齐到封面的中心
		if (!isVertical && coverElRef.current && layoutRef.current) {
			const obz = new ResizeObserver(() => {
				if (!(coverElRef.current && layoutRef.current)) return;
				const coverB = coverElRef.current.getBoundingClientRect();
				const layoutB = layoutRef.current.getBoundingClientRect();
				setAlignPosition(
					(coverB.top + coverB.height / 2 - layoutB.top) / layoutB.height,
				);
			});
			obz.observe(coverElRef.current);
			obz.observe(layoutRef.current);
			setAlignAnchor("center");
			return () => obz.disconnect();
		}
		// 如果是垂直布局，则把歌词对齐到顶部（歌曲信息下方）
		if (isVertical && layoutRef.current) {
			setAlignPosition(0.1);
			setAlignAnchor("top");
		}
	}, [isVertical]);

	return (
		<AutoLyricLayout
			ref={layoutRef}
			className={classNames(styles.autoLyricLayout, className)}
			onLayoutChange={setIsVertical}
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
					renderer={backgroundRenderer.renderer}
					staticMode={lyricBackgroundStaticMode}
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
					<PrebuiltMusicControls className={styles.bigControls} />
					<PrebuiltVolumeControl style={{ paddingBottom: "4em" }} />
				</>
			}
			controlsSlot={
				<>
					<PrebuiltMusicInfo className={styles.horizontalControls} />
					<PrebuiltProgressBar />
					<PrebuiltMusicControls className={styles.controls} />
					<PrebuiltVolumeControl />
				</>
			}
			lyricSlot={
				<PrebuiltCoreLyricPlayer
					alignPosition={alignPosition}
					alignAnchor={alignAnchor}
				/>
			}
			hideLyric={hideVerticalLyricView}
			{...rest}
		/>
	);
};

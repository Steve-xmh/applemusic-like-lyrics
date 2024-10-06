/**
 * @fileoverview
 * 已经部署好所有组件的歌词播放器组件，在正确设置所有的 Jotai 状态后可以开箱即用
 */

import { BackgroundRender, LyricPlayer } from "@applemusic-like-lyrics/react";
import structuredClone from "@ungap/structured-clone";
import { useAtom, useAtomValue } from "jotai";
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
	onClickAudioQualityTagAtom,
	onClickControlThumbAtom,
	onLyricLineClickAtom,
	onLyricLineContextMenuAtom,
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
	musicQualityTagAtom,
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
import { AnimatePresence, LayoutGroup } from "framer-motion";
import {
	PlayerControlsType,
	VerticalCoverLayout,
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
	lyricFontFamilyAtom,
	lyricFontWeightAtom,
	lyricLetterSpacingAtom,
	lyricPlayerImplementationAtom,
	lyricWordFadeWidthAtom,
	playerControlsTypeAtom,
	showBottomControlAtom,
	showMusicAlbumAtom,
	showMusicArtistsAtom,
	showMusicNameAtom,
	showVolumeControlAtom,
	verticalCoverLayoutAtom,
} from "../../states/config";
import { toDuration } from "../../utils";
import { AudioFFTVisualizer } from "../AudioFFTVisualizer";
import { AudioQualityTag } from "../AudioQualityTag";
import { MediaButton } from "../MediaButton";
import { PrebuiltToggleIconButton } from "../ToggleIconButton";
import { PrebuiltToggleIconButtonType } from "../ToggleIconButton/prebuilt-enum";
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
	const showMusicName = useAtomValue(showMusicNameAtom);
	const showMusicArtists = useAtomValue(showMusicArtistsAtom);
	const showMusicAlbum = useAtomValue(showMusicAlbumAtom);
	return (
		<MusicInfo
			className={className}
			style={style}
			name={showMusicName ? musicName : undefined}
			artists={showMusicArtists ? musicArtists.map((v) => v.name) : undefined}
			album={showMusicAlbum ? musicAlbum : undefined}
			onMenuButtonClicked={onMenuClicked}
		/>
	);
};

const PrebuiltMediaButtons: FC<{
	showOtherButtons?: boolean;
}> = ({ showOtherButtons }) => {
	const musicIsPlaying = useAtomValue(musicPlayingAtom);
	const onRequestPrevSong = useAtomValue(onRequestPrevSongAtom).onEmit;
	const onRequestNextSong = useAtomValue(onRequestNextSongAtom).onEmit;
	const onPlayOrResume = useAtomValue(onPlayOrResumeAtom).onEmit;
	return (
		<>
			{showOtherButtons && (
				<PrebuiltToggleIconButton type={PrebuiltToggleIconButtonType.Shuffle} />
			)}
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
			{showOtherButtons && (
				<PrebuiltToggleIconButton type={PrebuiltToggleIconButtonType.Repeat} />
			)}
		</>
	);
};

const PrebuiltProgressBar: FC = () => {
	const musicDuration = useAtomValue(musicDurationAtom);
	const musicPosition = useAtomValue(musicPlayingPositionAtom);
	const musicQualityTag = useAtomValue(musicQualityTagAtom);
	const onClickAudioQualityTag = useAtomValue(
		onClickAudioQualityTagAtom,
	).onEmit;
	const onSeekPosition = useAtomValue(onSeekPositionAtom).onEmit;

	return (
		<div>
			<BouncingSlider
				value={musicPosition}
				min={0}
				max={musicDuration}
				onChange={onSeekPosition}
			/>
			<div className={styles.progressBarLabels}>
				<div>{toDuration(musicPosition / 1000)}</div>
				<div>
					<AnimatePresence mode="popLayout">
						{musicQualityTag && (
							<AudioQualityTag
								className={styles.qualityTag}
								isDolbyAtmos={musicQualityTag.isDolbyAtmos}
								tagText={musicQualityTag.tagText}
								tagIcon={musicQualityTag.tagIcon}
								onClick={onClickAudioQualityTag}
							/>
						)}
					</AnimatePresence>
				</div>
				<div>{toDuration((musicPosition - musicDuration) / 1000)}</div>
			</div>
		</div>
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

	const lyricFontFamily = useAtomValue(lyricFontFamilyAtom);
	const lyricFontWeight = useAtomValue(lyricFontWeightAtom);
	const lyricLetterSpacing = useAtomValue(lyricLetterSpacingAtom);

	const lyricPlayerImplementation = useAtomValue(
		lyricPlayerImplementationAtom,
	).lyricPlayer;

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
	const onLyricLineClick = useAtomValue(onLyricLineClickAtom).onEmit;
	const onLyricLineContextMenu = useAtomValue(
		onLyricLineContextMenuAtom,
	).onEmit;

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
				fontFamily: lyricFontFamily || undefined,
				fontWeight: lyricFontWeight || undefined,
				letterSpacing: lyricLetterSpacing || undefined,
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
			wordFadeWidth={Math.max(0.01, lyricWordFadeWidth)}
			lyricPlayer={lyricPlayerImplementation}
			onLyricLineClick={onLyricLineClick}
			onLyricLineContextMenu={onLyricLineContextMenu}
		/>
	);
};

const PrebuiltVolumeControl: FC<{
	style?: React.CSSProperties;
	className?: string;
}> = ({ style, className }) => {
	const musicVolume = useAtomValue(musicVolumeAtom);
	const onChangeVolume = useAtomValue(onChangeVolumeAtom).onEmit;
	const showVolumeControl = useAtomValue(showVolumeControlAtom);
	if (showVolumeControl)
		return (
			<VolumeControl
				value={musicVolume}
				min={0}
				max={1}
				style={style}
				className={className}
				onChange={onChangeVolume}
			/>
		);
	return null;
};

const PrebuiltMusicControls: FC<
	{
		showOtherButtons?: boolean;
	} & HTMLProps<HTMLDivElement>
> = ({ className, showOtherButtons, ...props }) => {
	const playerControlsType = useAtomValue(playerControlsTypeAtom);
	const fftData = useAtomValue(fftDataAtom);
	return (
		<div className={classNames(styles.controls, className)} {...props}>
			{playerControlsType === PlayerControlsType.Controls && (
				<PrebuiltMediaButtons showOtherButtons={showOtherButtons} />
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
	const [hideLyricView, setHideLyricView] = useAtom(hideLyricViewAtom);
	const musicCover = useAtomValue(musicCoverAtom);
	const musicCoverIsVideo = useAtomValue(musicCoverIsVideoAtom);
	const musicIsPlaying = useAtomValue(musicPlayingAtom);
	const lowFreqVolume = useAtomValue(lowFreqVolumeAtom);
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);
	const lyricBackgroundFPS = useAtomValue(lyricBackgroundFPSAtom);
	const verticalCoverLayout = useAtomValue(verticalCoverLayoutAtom);
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
	const showBottomControl = useAtomValue(showBottomControlAtom);

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

	const verticalImmerseCover =  hideLyricView && (
		verticalCoverLayout === VerticalCoverLayout.Auto
			? musicCoverIsVideo && isVertical
			: verticalCoverLayout === VerticalCoverLayout.ForceImmersive);

	return (
		<LayoutGroup>
			<AutoLyricLayout
				ref={layoutRef}
				className={classNames(styles.autoLyricLayout, className)}
				onLayoutChange={setIsVertical}
				verticalImmerseCover={verticalImmerseCover}
				coverSlot={
					<Cover
						coverUrl={musicCover}
						coverIsVideo={musicCoverIsVideo}
						ref={coverElRef}
						musicPaused={
							!musicIsPlaying && !musicCoverIsVideo && verticalImmerseCover
						}
					/>
				}
				thumbSlot={<ControlThumb onClick={onClickControlThumb} />}
				smallControlsSlot={
					<PrebuiltMusicInfo
						className={classNames(
							styles.smallMusicInfo,
							hideLyricView && styles.hideLyric,
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
						staticMode={lyricBackgroundStaticMode || !isLyricPageOpened}
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
								hideLyricView && styles.hideLyric,
							)}
						/>
						<PrebuiltProgressBar />
						<PrebuiltMusicControls className={styles.bigControls} />
						{showBottomControl && (
							<div
								style={{
									display: "flex",
									justifyContent: "space-evenly",
								}}
							>
								<PrebuiltToggleIconButton
									type={PrebuiltToggleIconButtonType.Lyrics}
									checked={!hideLyricView}
									onClick={() => setHideLyricView(!hideLyricView)}
								/>
								<PrebuiltToggleIconButton
									type={PrebuiltToggleIconButtonType.AirPlay}
								/>
								<PrebuiltToggleIconButton
									type={PrebuiltToggleIconButtonType.Playlist}
								/>
							</div>
						)}
						<PrebuiltVolumeControl className={styles.bigVolumeControl} />
					</>
				}
				controlsSlot={
					<>
						<PrebuiltMusicInfo className={styles.horizontalControls} />
						<PrebuiltProgressBar />
						<PrebuiltMusicControls
							className={styles.controls}
							showOtherButtons
						/>
						<PrebuiltVolumeControl />
					</>
				}
				horizontalBottomControls={
					showBottomControl && (
						<>
							<PrebuiltToggleIconButton
								type={PrebuiltToggleIconButtonType.Playlist}
							/>
							<PrebuiltToggleIconButton
								type={PrebuiltToggleIconButtonType.Lyrics}
								checked={!hideLyricView}
								onClick={() => setHideLyricView(!hideLyricView)}
							/>
							<div style={{ flex: "1" }} />
							<PrebuiltToggleIconButton
								type={PrebuiltToggleIconButtonType.AirPlay}
							/>
						</>
					)
				}
				lyricSlot={
					<PrebuiltCoreLyricPlayer
						alignPosition={alignPosition}
						alignAnchor={alignAnchor}
					/>
				}
				hideLyric={hideLyricView}
				{...rest}
			/>
		</LayoutGroup>
	);
};

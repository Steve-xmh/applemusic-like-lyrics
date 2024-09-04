import type { FC } from "react";
import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
	displayMusicCoverAtom,
	loadableMusicOverrideDataAtom,
	playStatusAtom,
} from "../../music-context/wrapper";
import "./index.sass";
import {
	disableMixBlendModeAtom,
	fontColorAtom,
	hideCursorWhenHoveringCoverAtom,
	primaryColorAtom,
	showAlbumImageAtom,
	showControlThumbAtom,
	showStatsAtom,
} from "../../components/config/atoms";
import { topbarMenuOpenedAtom } from "../common/main-menu";
import Stats from "stats.js";
import { PlayState } from "../../music-context";
import { MusicInfo } from "./info";
import { CoreLyricPlayer } from "../common/player";
import classNames from "classnames";
import { lyricLinesAtom } from "../../lyric/provider";
import { ControlThumb } from "../common/control-thumb";
import boxDropShadow from "../../assets/box-dropshadow@2000px.png";

export const LyricPlayerHorizonal: FC = () => {
	const musicCoverUrl = useAtomValue(displayMusicCoverAtom);
	const showStats = useAtomValue(showStatsAtom);
	const fontColor = useAtomValue(fontColorAtom);
	const primaryColor = useAtomValue(primaryColorAtom);
	const playStatus = useAtomValue(playStatusAtom);
	const setMenuOpened = useSetAtom(topbarMenuOpenedAtom);
	const showAlbumImage = useAtomValue(showAlbumImageAtom);
	const showControlThumb = useAtomValue(showControlThumbAtom);
	const disableMixBlendMode = useAtomValue(disableMixBlendModeAtom);
	const albumCoverRef = useRef<HTMLDivElement>(null);
	const loadableMusicOverrideData = useAtomValue(loadableMusicOverrideDataAtom);
	const lyricLines = useAtomValue(lyricLinesAtom);
	const hideCursorWhenHoveringCover = useAtomValue(
		hideCursorWhenHoveringCoverAtom,
	);

	useEffect(() => {
		if (showStats) {
			const statsObj = new Stats();
			statsObj.dom.style.display = "none";
			statsObj.dom.style.top = "50px";
			statsObj.dom.style.display = "";
			document.body.appendChild(statsObj.dom);
			let canceled = false;
			const onFrame = () => {
				statsObj.end();
				if (!canceled) {
					statsObj.begin();
					requestAnimationFrame(onFrame);
				}
			};
			requestAnimationFrame(onFrame);
			return () => {
				canceled = true;
				statsObj.dom.remove();
				statsObj.dom.style.display = "none";
				statsObj.end();
			};
		}
	}, [showStats]);

	return (
		<div
			className={classNames("lyric-player-horizonal", {
				"no-lyric":
					lyricLines.state === "hasData" && lyricLines.data.length === 0,
			})}
			style={
				{
					"--amll-lyric-font-color": fontColor,
					"--amll-lyric-view-color": fontColor,
					"--amll-lyric-primary-color": primaryColor,
					"--amll-lyric-primary-color-t15": `${primaryColor}15`,
					"--amll-lyric-primary-color-t30": `${primaryColor}2D`,
					"--amll-lyric-mix-blend-mode": disableMixBlendMode
						? "normal"
						: "plus-lighter",
					color: fontColor,
				} as any
			}
			onContextMenu={(evt) => {
				setMenuOpened(true);
				evt.preventDefault();
				evt.stopPropagation();
			}}
		>
			<div
				style={{
					gridColumn: "center-space",
					gridRow: "1 / 7",
				}}
			/>
			{showControlThumb ? <ControlThumb /> : <div />}
			{/* {showAlbumImage && (
				<div
					style={{
						backgroundImage: `url(${boxDropShadow})`,
					}}
					className="amll-cover-shadow"
				/>
			)} */}
			{showAlbumImage &&
				(loadableMusicOverrideData.state === "hasData" &&
				loadableMusicOverrideData.data.musicCoverIsVideo ? (
					<div
						className={classNames("amll-cover-image amll-cover-image-video", {
							"hide-cursor": hideCursorWhenHoveringCover,
							"is-playing": playStatus === PlayState.Playing,
						})}
						ref={albumCoverRef}
					>
						<video
							playsInline
							autoPlay
							loop
							muted
							crossOrigin="anonymous"
							style={{
								width: "100%",
								height: "100%",
								objectPosition: "center",
								objectFit: "cover",
							}}
							src={loadableMusicOverrideData.data.musicCoverUrl}
						/>
					</div>
				) : (
					<div
						style={{
							backgroundImage: `url(${musicCoverUrl})`,
						}}
						className={classNames("amll-cover-image", {
							"hide-cursor": hideCursorWhenHoveringCover,
							"is-playing": playStatus === PlayState.Playing,
						})}
						ref={albumCoverRef}
					/>
				))}
			<MusicInfo />
			<CoreLyricPlayer albumCoverRef={albumCoverRef} />
			<div
				data-tauri-drag-region
				style={{
					height: "30px",
					gridColumn: "1 / 4",
					gridRow: "1",
					zIndex: "1",
				}}
				onMouseDown={(evt) => {
					evt.preventDefault();
					evt.stopPropagation();
					channel.call("winhelper.dragWindow", () => {}, []);
				}}
			/>
		</div>
	);
};

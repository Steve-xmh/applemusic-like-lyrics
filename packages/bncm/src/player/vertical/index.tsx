import { useRef, type FC } from "react";
import { topbarMenuOpenedAtom } from "../common/main-menu";
import { useSetAtom, useAtomValue } from "jotai";
import {
	disableMixBlendModeAtom,
	fontColorAtom,
	hideCursorWhenHoveringCoverAtom,
	primaryColorAtom,
	showAlbumImageAtom,
	showControlThumbAtom,
} from "../../components/config/atoms";
import "./index.sass";
import { closeLyricPage } from "../../injector";
import { MusicInfo } from "./info";
import { CoreLyricPlayer } from "../common/player";
import {
	displayMusicCoverAtom,
	loadableMusicOverrideDataAtom,
} from "../../music-context/wrapper";
import { ControlThumb } from "../common/control-thumb";
import classNames from "classnames";

export const LyricPlayerVertical: FC = () => {
	const musicCoverUrl = useAtomValue(displayMusicCoverAtom);
	const fontColor = useAtomValue(fontColorAtom);
	const primaryColor = useAtomValue(primaryColorAtom);
	const showAlbumImage = useAtomValue(showAlbumImageAtom);
	const showControlThumb = useAtomValue(showControlThumbAtom);
	const disableMixBlendMode = useAtomValue(disableMixBlendModeAtom);
	const setMenuOpened = useSetAtom(topbarMenuOpenedAtom);
	const loadableMusicOverrideData = useAtomValue(loadableMusicOverrideDataAtom);
	const albumCoverRef = useRef<HTMLDivElement>(null);
	const hideCursorWhenHoveringCover = useAtomValue(
		hideCursorWhenHoveringCoverAtom,
	);
	return (
		<div
			className="lyric-player-vertical"
			style={
				{
					"--amll-lyric-player-font-size": "min(3.5vh, 8vw)",
					"--amll-lyric-font-color": fontColor,
					"--amll-lyric-view-color": fontColor,
					"--amll-lyric-primary-color": primaryColor,
					"--amll-lyric-primary-color-t15": `${primaryColor}15`,
					"--amll-lyric-primary-color-t30": `${primaryColor}25`,
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
			{showControlThumb && <ControlThumb />}
			{showAlbumImage &&
				(loadableMusicOverrideData.state === "hasData" &&
				loadableMusicOverrideData.data.musicCoverIsVideo ? (
					<div
						className={classNames("amll-cover-image amll-cover-image-video", {
							"hide-cursor": hideCursorWhenHoveringCover,
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
						className={classNames("amll-cover-image", {
							"hide-cursor": hideCursorWhenHoveringCover,
						})}
						style={{
							backgroundImage: `url(${musicCoverUrl})`,
							imageRendering: "auto",
						}}
						ref={albumCoverRef}
					/>
				))}
			<div
				style={{
					height: "30px",
					gridColumn: "1 / 5",
					gridRow: "1",
					zIndex: "1",
					pointerEvents: "none",
				}}
				onMouseDown={(evt) => {
					evt.preventDefault();
					evt.stopPropagation();
					channel.call("winhelper.dragWindow", () => {}, []);
				}}
			/>
			<MusicInfo />
			<CoreLyricPlayer isVertical albumCoverRef={albumCoverRef.current} />
		</div>
	);
};

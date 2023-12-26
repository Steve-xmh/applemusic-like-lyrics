import { useRef, type FC } from "react";
import { topbarMenuOpenedAtom } from "../common/main-menu";
import { useSetAtom, useAtomValue } from "jotai";
import {
	disableMixBlendModeAtom,
	fontColorAtom,
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
	return (
		<div
			className="lyric-player-vertical"
			style={
				{
					"--amll-lyric-font-color": fontColor,
					"--amll-lyric-view-color": fontColor,
					"--amll-lyric-primary-color": primaryColor,
					"--amll-lyric-primary-color-t15": `${primaryColor}26`,
					"--amll-lyric-primary-color-t30": `${primaryColor}4D`,
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
			{showControlThumb && (
				<button
					className="amll-control-thumb"
					type="button"
					onClick={() => {
						closeLyricPage();
					}}
				/>
			)}
			{showAlbumImage &&
				(loadableMusicOverrideData.state === "hasData" &&
				loadableMusicOverrideData.data.musicCoverIsVideo ? (
					<div
						className="amll-cover-image amll-cover-image-video"
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
						className="amll-cover-image"
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

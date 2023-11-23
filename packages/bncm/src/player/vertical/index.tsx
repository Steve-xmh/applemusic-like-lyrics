import { useRef, type FC } from "react";
import { topbarMenuOpenedAtom } from "../common/main-menu";
import { useSetAtom, useAtomValue } from "jotai";
import {
	fontColorAtom,
	primaryColorAtom,
	showAlbumImageAtom,
	showControlThumbAtom,
} from "../../components/config/atoms";
import "./index.sass";
import { closeLyricPage } from "../../injector";
import { MusicInfo } from "./info";
import { CoreLyricPlayer } from "../common/player";
import { displayMusicCoverAtom } from "../../music-context/wrapper";

export const LyricPlayerVertical: FC = () => {
	const musicCoverUrl = useAtomValue(displayMusicCoverAtom);
	const fontColor = useAtomValue(fontColorAtom);
	const primaryColor = useAtomValue(primaryColorAtom);
	const showAlbumImage = useAtomValue(showAlbumImageAtom);
	const showControlThumb = useAtomValue(showControlThumbAtom);
	const setMenuOpened = useSetAtom(topbarMenuOpenedAtom);
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
			{showAlbumImage && (
				<div
					style={{
						backgroundImage: `url(${musicCoverUrl})`,
						imageRendering: "auto",
					}}
					className="amll-cover-image"
					ref={albumCoverRef}
				/>
			)}
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

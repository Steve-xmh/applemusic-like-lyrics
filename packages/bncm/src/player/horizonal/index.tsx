import type { FC } from "react";
import { closeLyricPage } from "../../injector";
import { useAtomValue, useSetAtom } from "jotai";
import { musicCoverAtom, playStatusAtom } from "../../music-context/wrapper";
import "./index.sass";
import {
	showStatsAtom,
	fontColorAtom,
	showAlbumImageAtom,
	showControlThumbAtom,
} from "../../components/config/atoms";
import { useEffect, useRef } from "react";
import { topbarMenuOpenedAtom } from "../common/main-menu";
import {
	AMLLConfigWindowed,
	amllConfigWindowedOpenedAtom,
} from "../../components/config";
import Stats from "stats.js";
import { PlayState } from "../../music-context";
import { MusicInfo } from "./info";
import { CoreLyricPlayer } from "../common/player";

export const LyricPlayerHorizonal: FC = () => {
	const musicCoverUrl = useAtomValue(musicCoverAtom);
	const showStats = useAtomValue(showStatsAtom);
	const fontColor = useAtomValue(fontColorAtom);
	const playStatus = useAtomValue(playStatusAtom);
	const setMenuOpened = useSetAtom(topbarMenuOpenedAtom);
	const showAlbumImage = useAtomValue(showAlbumImageAtom);
	const showControlThumb = useAtomValue(showControlThumbAtom);
	const albumCoverRef = useRef<HTMLDivElement>(null);

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
		<>
			<div
				className="lyric-player-horizonal"
				style={
					{
						"--amll-lyric-view-color": fontColor,
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
							transform: playStatus === PlayState.Playing ? "" : "scale(0.75)",
						}}
						className="amll-cover-image"
						ref={albumCoverRef}
					/>
				)}
				<MusicInfo />
				<CoreLyricPlayer albumCoverRef={albumCoverRef.current} />
				<div
					style={{
						height: "30px",
						gridColumn: "1 / 3",
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
		</>
	);
};

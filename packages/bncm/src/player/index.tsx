import type { FC } from "react";
import { closeLyricPage } from "../injector";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import {
	currentTimeAtom,
	lyricPageOpenedAtom,
	musicArtistsAtom,
	musicCoverAtom,
	playStatusAtom,
} from "../music-context/wrapper";
import { lyricLinesAtom } from "../lyric/provider";
import { wsConnectionStatusAtom } from "../music-context/ws-wrapper";
import "./index.sass";
import {
	showStatsAtom,
	fontColorAtom,
	showAlbumImageAtom,
	showControlThumbAtom,
} from "../components/config/atoms";
import { useEffect, useRef } from "react";
import { MainMenu, topbarMenuOpenedAtom } from "./main-menu";
import {
	AMLLConfigWindowed,
	amllConfigWindowedOpenedAtom,
} from "../components/config";
import Stats from "stats.js";
import { PlayState } from "../music-context";
import { Background } from "./background";
import { MusicInfo } from "./info";
import { CoreLyricPlayer } from "./player";

export const LyricPlayer: FC = () => {
	const musicCoverUrl = useAtomValue(musicCoverAtom);
	const amllConfigWindowedOpened = useAtomValue(amllConfigWindowedOpenedAtom);
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
				className="lyric-player"
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
				<Background />
				{showControlThumb && (
					<button
						style={{
							gridColumn: "1",
							gridRow: "2",
							width: "50px",
							height: "8px",
							margin: "2vh",
							borderRadius: "4px",
							border: "none",
							backgroundColor: "#FFF3",
							justifySelf: "center",
							mixBlendMode: "plus-lighter",
						}}
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
							aspectRatio: "1/1",
							gridColumn: "1",
							gridRow: "3",
							alignSelf: "center",
							justifySelf: "center",
							width: "min(50vh,40vw)",
							height: "min(50vh,40vw)",
							transition:
								"background-image 0.5s linear, transform 0.5s cubic-bezier(0.4, 0.2, 0.1, 1)",
							backgroundImage: `url(${musicCoverUrl})`,
							backgroundPosition: "center",
							backgroundSize: "cover",
							transform: playStatus === PlayState.Playing ? "" : "scale(0.75)",
							borderRadius: "2%",
							boxShadow: "rgba(0,0,0,0.4) 0px 16px 32px",
						}}
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
			<MainMenu />
			{amllConfigWindowedOpened && <AMLLConfigWindowed />}
		</>
	);
};

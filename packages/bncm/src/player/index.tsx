import type { FC } from "react";
import {
	BackgroundRender,
	LyricPlayer as LyricPlayerComponent,
} from "@applemusic-like-lyrics/react";
import { closeLyricPage } from "../injector";
import { useAtomValue } from "jotai";
import { currentTimeAtom, musicCoverAtom, musicNameAtom } from "../info/wrapper";
import { SongInfoTextMarquee } from "../components/song-info/song-info-text-marquee";
import { lyricLinesAtom } from "../lyric/provider";
export const LyricPlayer: FC = (props) => {
	const musicCoverUrl = useAtomValue(musicCoverAtom);
	const musicName = useAtomValue(musicNameAtom);
	const lyricLines = useAtomValue(lyricLinesAtom);
	const currentTime = useAtomValue(currentTimeAtom);
	return (
		<div className="lyric-player">
			<BackgroundRender
				style={{
					gridColumn: "1 / 3",
					gridRow: "1 / 7",
					position: "absolute",
					width: "100%",
					height: "100%",
					pointerEvents: "none",
					zIndex: "-1",
				}}
				albumImageUrl={musicCoverUrl}
			/>
			<button
				style={{
					gridColumn: "1",
					gridRow: "2",
					width: "32px",
					height: "32px",
					borderRadius: "4px",
					border: "none",
					backgroundColor: "#FFF3",
					justifySelf: "center",
					mixBlendMode: "plus-lighter",
				}}
				type="button"
				onClick={() => {
					closeLyricPage();
				}}
			/>
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
						"background-image 0.5s linear, transform 0.5s ease-in-out",
					backgroundImage: `url(${musicCoverUrl})`,
					backgroundPosition: "center",
					backgroundSize: "cover",
					borderRadius: "3%",
				}}
			/>
			<div
				style={{
					gridColumn: "1",
					gridRow: "4",
					maxWidth: "min(50vh,40vw)",
					width: "min(50vh,40vw)",
					justifySelf: "center",
					mixBlendMode: "plus-lighter",
					fontSize: "200%",
					fontWeight: "1000",
				}}
			>
				<SongInfoTextMarquee>
					<div className="amll-music-name">{musicName}</div>
				</SongInfoTextMarquee>
				<SongInfoTextMarquee>
					<div className="amll-music-name">{musicName}</div>
				</SongInfoTextMarquee>
			</div>
			<LyricPlayerComponent
				style={{
					gridColumn: "2",
					gridRow: "1 / 6",
					width: "100%",
					height: "100%",
					mixBlendMode: "plus-lighter",
				}}
				currentTime={currentTime}
				lyricLines={lyricLines}
			/>
			<div
				style={{
					height: "50px",
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
	);
};

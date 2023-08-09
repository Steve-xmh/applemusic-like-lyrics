import type { FC } from "react";
import {
	BackgroundRender,
	LyricPlayer as LyricPlayerComponent,
} from "@applemusic-like-lyrics/react";
import { closeLyricPage } from "../injector";
import { useAtomValue } from "jotai";
import {
	currentTimeAtom,
	lyricPageOpenedAtom,
	musicArtistsAtom,
	musicCoverAtom,
	musicNameAtom,
} from "../info/wrapper";
import { SongInfoTextMarquee } from "../components/song-info/song-info-text-marquee";
import { lyricLinesAtom } from "../lyric/provider";
import { ConnectionColor, wsConnectionStatusAtom } from "../info/ws-wrapper";
import "./index.sass";

export const LyricPlayer: FC = (props) => {
	const musicCoverUrl = useAtomValue(musicCoverAtom);
	const musicName = useAtomValue(musicNameAtom);
	const artists = useAtomValue(musicArtistsAtom);
	const lyricLines = useAtomValue(lyricLinesAtom);
	const currentTime = useAtomValue(currentTimeAtom);
	const lyricPageOpened = useAtomValue(lyricPageOpenedAtom);
	const wsStatus = useAtomValue(wsConnectionStatusAtom);
	return (
		<>
			<div className="lyric-player">
				{wsStatus.color !== ConnectionColor.Active && (
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
				)}
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
						<div className="amll-music-artists">
							{artists.map((artist) => (
								<a
									href={`#/m/artist/?id=${artist.id}`}
									key={`artist-${artist.id}-${artist.name}`}
									onMouseUp={() => {
										closeLyricPage();
									}}
								>
									{artist.name}
								</a>
							))}
						</div>
					</SongInfoTextMarquee>
				</div>
				{wsStatus.color === ConnectionColor.Active ? (
					<div
						style={{
							gridColumn: "2",
							gridRow: "1 / 6",
							width: "100%",
							height: "100%",
							mixBlendMode: "plus-lighter",
							display: "flex",
							flexDirection: "column",
							justifyContent: "center",
							alignItems: "center",
							gap: "16px",
						}}
					>
						<div>歌词播放器已连接 当前歌词页面已自动禁用以降低占用</div>
						<div>
							如需在连接的时候保持开启，请在杂项设置中勾选“歌词播放器连接时保持启用内嵌歌词页面”
						</div>
					</div>
				) : (
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
				)}
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
		</>
	);
};

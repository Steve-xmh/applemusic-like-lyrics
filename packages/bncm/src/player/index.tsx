import type { FC } from "react";
import {
	BackgroundRender,
	LyricPlayer as LyricPlayerComponent,
} from "@applemusic-like-lyrics/react";
import { closeLyricPage } from "../injector";
import {atom, useAtom, useAtomValue} from "jotai";
import {
    currentTimeAtom,
    lyricPageOpenedAtom,
    musicArtistsAtom,
    musicCoverAtom, musicDurationAtom,
    musicNameAtom,
} from "../music-context/wrapper";
import { SongInfoTextMarquee } from "../components/song-info/song-info-text-marquee";
import { lyricLinesAtom } from "../lyric/provider";
import { ConnectionColor, wsConnectionStatusAtom } from "../music-context/ws-wrapper";
import "./index.sass";
import {NowPlayingSlider} from "../components/appkit/np-slider";
import {AudioQualityTag} from "../components/song-info/audio-quality-tag";
import * as React from "react";
import {showAudioQualityTagAtom} from "../components/config/music";
import {PlayControls} from "../components/song-info/play-controls";
import {useEffect, useLayoutEffect, useRef} from "react";
import {VolumeControl} from "./volume-control";
import IconMore from "../assets/icon_more.svg";

function toDuration(duration: number) {
    const isRemainTime = duration < 0;

    const d = Math.abs(duration | 0);
    const sec = d % 60;
    const min = Math.floor((d - sec) / 60);
    const secText = "0".repeat(2 - sec.toString().length) + sec;

    return `${isRemainTime ? "-" : ""}${min}:${secText}`;
}

const alignPositionAtom = atom(0.5);

export const LyricPlayer: FC = (props) => {
	const musicCoverUrl = useAtomValue(musicCoverAtom);
	const musicName = useAtomValue(musicNameAtom);
	const artists = useAtomValue(musicArtistsAtom);
	const lyricLines = useAtomValue(lyricLinesAtom);
	const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
	const lyricPageOpened = useAtomValue(lyricPageOpenedAtom);
	const wsStatus = useAtomValue(wsConnectionStatusAtom);
    const musicDuration = useAtomValue(musicDurationAtom);
    const showQualityTag = useAtomValue(showAudioQualityTagAtom);

    const playProgressText = toDuration(currentTime / 1000);
    const remainText = toDuration((currentTime - musicDuration) / 1000);

    const albumCoverRef = useRef<HTMLDivElement>(null);
    const [alignPosition, setAlighPosition] = useAtom(alignPositionAtom);

    useEffect(() => {
        if (albumCoverRef.current) {
            const el = albumCoverRef.current;
            const onResize = () => {
                setAlighPosition((el.offsetTop + el.clientHeight / 2) / window.innerHeight);
            }
            window.addEventListener("resize", onResize);
            onResize();
            requestAnimationFrame(onResize);
            return () => {
                window.removeEventListener("resize", onResize);
            }
        } else {
            setAlighPosition(0.5);
        }
    }, [albumCoverRef.current])

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
						width: "50px",
						height: "8px",
                        margin: "2vh",
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
                    ref={albumCoverRef}
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
					<div style={{
                        display: "flex",
                    }}>
                        <div style={{
                            display: "flex",
                            flex: "1",
                            flexDirection: "column",
                            minWidth: "0",
                        }}>
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
                        <button
                            className="am-music-main-menu"
                        >
                            <IconMore color="#FFFFFF" />
                        </button>
                    </div>
                    <div className="am-music-progress-control">
                        <NowPlayingSlider
                            onChange={setCurrentTime}
                            value={currentTime}
                            min={0}
                            max={musicDuration}
                        />
                        <div className="am-music-progress-tips">
                            <div>{playProgressText}</div>
                            {showQualityTag && <AudioQualityTag />}
                            <div>{remainText}</div>
                        </div>
                    </div>
                    <PlayControls />
                    <VolumeControl />
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
                            boxSizing: "border-box",
                            paddingRight: "10%",
							mixBlendMode: "plus-lighter",
						}}
                        alignAnchor={alignPosition}
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

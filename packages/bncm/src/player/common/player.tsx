import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useState, type FC, useEffect, useRef } from "react";
import {
	currentTimeAtom,
	lyricPageOpenedAtom,
	musicArtistsAtom,
} from "../../music-context/wrapper";
import {
	LyricPlayer as LyricPlayerComponent,
	type LyricPlayerRef,
} from "@applemusic-like-lyrics/react";
import {
	ConnectionColor,
	wsConnectionStatusAtom,
} from "../../music-context/ws-wrapper";
import { lyricLinesAtom } from "../../lyric/provider";
import { rightClickedLyricAtom } from "./lyric-line-menu";

export const CoreLyricPlayer: FC<{
	albumCoverRef: HTMLElement | null;
}> = (props) => {
	const playerRef = useRef<LyricPlayerRef>(null);
	const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
	const artists = useAtomValue(musicArtistsAtom);
	const wsStatus = useAtomValue(wsConnectionStatusAtom);
	const lyricPageOpened = useAtomValue(lyricPageOpenedAtom);
	const lyricLines = useAtomValue(lyricLinesAtom);
	const setRightClickedLyric = useSetAtom(rightClickedLyricAtom);

	const [alignPosition, setAlighPosition] = useState(0.5);

	useEffect(() => {
		if (props.albumCoverRef) {
			const el = props.albumCoverRef;
			const onResize = () => {
				setAlighPosition(
					(el.offsetTop + el.clientHeight / 2) / window.innerHeight,
				);
			};
			window.addEventListener("resize", onResize);
			onResize();
			requestAnimationFrame(onResize);
			return () => {
				window.removeEventListener("resize", onResize);
			};
		} else {
			setAlighPosition(0.5);
		}
	}, [props.albumCoverRef]);

	if (wsStatus.color === ConnectionColor.Active) {
		return (
			<div className="amll-lyric-player-wrapper">
				<div>歌词播放器已连接 当前歌词页面已自动禁用以降低占用</div>
				<div>
					如需在连接的时候保持开启，请在杂项设置中勾选“歌词播放器连接时保持启用内嵌歌词页面”
				</div>
			</div>
		);
	} else {
		return (
			<LyricPlayerComponent
				className="amll-lyric-player-wrapper"
				disabled={!lyricPageOpened}
				alignAnchor={props.albumCoverRef ? "center" : "top"}
				alignPosition={props.albumCoverRef ? alignPosition : 0.2}
				currentTime={currentTime}
				lyricLines={lyricLines}
				ref={playerRef}
				onLyricLineClick={(line) => {
					line.preventDefault();
					line.stopPropagation();
					line.stopImmediatePropagation();
					setCurrentTime(line.line.getLine().startTime);
					playerRef.current?.lyricPlayer?.resetScroll();
					playerRef.current?.lyricPlayer?.calcLayout();
				}}
				onLyricLineContextMenu={(line) => {
					line.preventDefault();
					line.stopPropagation();
					line.stopImmediatePropagation();
					setRightClickedLyric(line.line.getLine());
				}}
				bottomLine={
					<div className="amll-contributors">
						贡献者：{artists.map((v) => v.name).join(", ")}
					</div>
				}
			/>
		);
	}
};

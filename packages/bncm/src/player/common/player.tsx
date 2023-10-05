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
import {
	lyricBlurEffectAtom,
	lyricScaleEffectAtom,
	lyricSpringEffectAtom,
} from "../../components/config/atoms";

export const CoreLyricPlayer: FC<{
	albumCoverRef: HTMLElement | null;
}> = (props) => {
	const playerRef = useRef<LyricPlayerRef>(null);
	const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
	const artists = useAtomValue(musicArtistsAtom);
	const wsStatus = useAtomValue(wsConnectionStatusAtom);
	const lyricPageOpened = useAtomValue(lyricPageOpenedAtom);
	const lyricLines = useAtomValue(lyricLinesAtom);
	const lyricBlurEffect = useAtomValue(lyricBlurEffectAtom);
	const lyricScaleEffect = useAtomValue(lyricScaleEffectAtom);
	const lyricSpringEffect = useAtomValue(lyricSpringEffectAtom);
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
			<>
				<LyricPlayerComponent
					className="amll-lyric-player-wrapper"
					disabled={!lyricPageOpened}
					alignAnchor={props.albumCoverRef ? "center" : "top"}
					alignPosition={props.albumCoverRef ? alignPosition : 0.2}
					currentTime={currentTime}
					enableBlur={lyricBlurEffect}
					enableSpring={lyricSpringEffect}
					enableScale={lyricScaleEffect}
					lyricLines={lyricLines.state === "hasData" ? lyricLines.data : []}
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
						lyricLines.state === "hasData" ? (
							<div className="amll-contributors">
								贡献者：{artists.map((v) => v.name).join(", ")}
							</div>
						) : null
					}
				/>
				{lyricLines.state === "loading" && (
					<div className="amll-lyric-player-wrapper load-status">
						<div>歌词加载中</div>
					</div>
				)}
				{lyricLines.state === "hasError" && (
					<div className="amll-lyric-player-wrapper load-status">
						<div>歌词加载失败或歌词不存在</div>
						<div>可前往设置页 - 歌词源设置下查询搜索日志分析原因</div>
					</div>
				)}
			</>
		);
	}
};

import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import {
	useState,
	type FC,
	useEffect,
	useRef,
	RefObject,
	useMemo,
} from "react";
import {
	currentTimeAtom,
	seekingAtom,
	lyricPageOpenedAtom,
	musicArtistsAtom,
	playStatusAtom,
} from "../../music-context/wrapper";
import {
	LyricPlayer as LyricPlayerComponent,
	type LyricPlayerRef,
} from "@applemusic-like-lyrics/react";
import {
	ConnectionColor,
	wsConnectionStatusAtom,
} from "../../music-context/ws-states";
import { lyricLinesAtom, usingLyricSourceAtom } from "../../lyric/provider";
import { rightClickedLyricAtom } from "./lyric-line-menu";
import {
	keepBuiltinPlayerWhenConnectedAtom,
	lyricAdvanceDynamicLyricTimeAtom,
	lyricBlurEffectAtom,
	lyricHidePassedAtom,
	lyricScaleEffectAtom,
	lyricSpringEffectAtom,
	lyricWordFadeWidthAtom,
	playPositionOffsetAtom,
	showAMLLTTMLDBTipAtom,
} from "../../components/config/atoms";
import { AMLLEnvironment, amllEnvironmentAtom } from "../../injector";
import "./player.sass";
import { PlayState } from "../../music-context";

let isSeeking = false;

const offsetedCurrentTimeAtom = atom(
	(get) => {
		const offset = get(playPositionOffsetAtom);
		const currentTime = get(currentTimeAtom);
		isSeeking = get(seekingAtom);
		if (offset.state === "hasData") {
			return currentTime + offset.data;
		}
		return currentTime;
	},
	(_get, set, action: number) => {
		set(currentTimeAtom, action);
	},
);

export const CoreLyricPlayer: FC<{
	albumCoverRef?: RefObject<HTMLElement | null>;
	isVertical?: boolean;
}> = (props) => {
	const playerRef = useRef<LyricPlayerRef>(null);
	const [currentTime, setCurrentTime] = useAtom(offsetedCurrentTimeAtom);
	const artists = useAtomValue(musicArtistsAtom);
	const keepBuiltinPlayerWhenConnected = useAtomValue(
		keepBuiltinPlayerWhenConnectedAtom,
	);
	const wsStatus = useAtomValue(wsConnectionStatusAtom);
	const lyricPageOpened = useAtomValue(lyricPageOpenedAtom);
	const playStatus = useAtomValue(playStatusAtom);
	const lyricLines = useAtomValue(lyricLinesAtom);
	const usingLyricSource = useAtomValue(usingLyricSourceAtom);
	const lyricAdvanceDynamicLyricTime = useAtomValue(
		lyricAdvanceDynamicLyricTimeAtom,
	);
	const lyricBlurEffect = useAtomValue(lyricBlurEffectAtom);
	const lyricScaleEffect = useAtomValue(lyricScaleEffectAtom);
	const lyricSpringEffect = useAtomValue(lyricSpringEffectAtom);
	const lyricHidePassed = useAtomValue(lyricHidePassedAtom);
	const lyricWordFadeWidth = useAtomValue(lyricWordFadeWidthAtom);
	const amllEnvironment = useAtomValue(amllEnvironmentAtom);
	const showAMLLTTMLDBTip = useAtomValue(showAMLLTTMLDBTipAtom);
	const setRightClickedLyric = useSetAtom(rightClickedLyricAtom);

	const [alignPosition, setAlighPosition] = useState(0.5);

	useEffect(() => {
		const el = props.albumCoverRef?.current;
		console.log("已更新居中位置", el);
		if (el) {
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
		}
		setAlighPosition(0.5);
	}, [props.albumCoverRef?.current, lyricPageOpened]);

	const cachedLyricLines = useMemo(
		() => (lyricLines.state === "hasData" ? lyricLines.data : []),
		[lyricLines],
	);

	if (
		wsStatus.color === ConnectionColor.Active &&
		!keepBuiltinPlayerWhenConnected
	) {
		return (
			<div className="amll-lyric-player-wrapper">
				<div>歌词播放器已连接 当前歌词页面已自动禁用以降低占用</div>
				<div>
					如需在连接的时候保持开启，请在杂项设置中勾选“歌词播放器连接时保持启用内嵌歌词页面”
				</div>
			</div>
		);
	}
	return (
		<>
			<LyricPlayerComponent
				className="amll-lyric-player-wrapper"
				disabled={!lyricPageOpened}
				alignAnchor={
					!props.isVertical && props.albumCoverRef ? "center" : "top"
				}
				alignPosition={
					!props.isVertical && props.albumCoverRef ? alignPosition : 0.1
				}
				playing={playStatus === PlayState.Playing}
				currentTime={currentTime}
				isSeeking={isSeeking}
				enableLyricAdvanceDynamicLyricTime={lyricAdvanceDynamicLyricTime}
				enableBlur={lyricBlurEffect}
				enableSpring={lyricSpringEffect}
				enableScale={lyricScaleEffect}
				hidePassedLines={lyricHidePassed}
				wordFadeWidth={lyricWordFadeWidth}
				lyricLines={cachedLyricLines}
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
							<div>创作者：{artists.map((v) => v.name).join("、")}</div>
							{usingLyricSource.state === "hasData" &&
							usingLyricSource.data.type === "builtin:amll-ttml-db" &&
							showAMLLTTMLDBTip ? (
								<div className="ttml-db-tip">
									{/* biome-ignore lint/a11y/useValidAnchor: <explanation> */}
									<a
										href="javascript:void(0);"
										onClick={() => {
											betterncm.ncm.openUrl(
												"https://github.com/Steve-xmh/amll-ttml-db",
											);
										}}
										title="点击可以一起贡献更加出色的 TTML 歌词哦！"
									>
										本歌词由 AMLL TTML 歌词数据库强力驱动
									</a>
								</div>
							) : null}
						</div>
					) : null
				}
			/>
			{lyricLines.state === "loading" && (
				<>
					{amllEnvironment === AMLLEnvironment.AMLLPlayer && (
						<div className="amll-lyric-player-wrapper load-status">
							<div>等待连接中</div>
						</div>
					)}
					{amllEnvironment === AMLLEnvironment.BetterNCM && (
						<div className="amll-lyric-player-wrapper load-status">
							<div>歌词加载中</div>
						</div>
					)}
				</>
			)}
			{lyricLines.state === "hasError" && (
				<div className="amll-lyric-player-wrapper load-status">
					<div>歌词加载失败或歌词不存在</div>
					<div>可前往设置页 - 歌词源设置下查询搜索日志分析原因</div>
				</div>
			)}
		</>
	);
};

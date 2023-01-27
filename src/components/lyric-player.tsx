import { genAudioPlayerCommand, loadLyric, PlayState } from "../api";
import {
	useAlbumImageUrl,
	useConfigBoolean,
	useConfigValueBoolean,
	useFMOpened,
	useForceUpdate,
	useNowPlayingOpened,
} from "../api/react";
import { log } from "../utils/logger";
import { LyricDots } from "./lyric-dom-renderer/lyric-dots";
import { LyricLine, parseLyric } from "../core/lyric-parser";
import { Tween, Easing } from "../tweenjs";
import * as React from "react";
import { GLOBAL_EVENTS } from "../utils/global-events";
import { Loader, Center, LoadingOverlay } from "@mantine/core";
import { LyricBackground } from "./lyric-background";
import { LyricLineView } from "./lyric-dom-renderer/lyric-line";
import { guessTextReadDuration } from "../utils";
import {
	albumAtom,
	currentAudioDurationAtom,
	currentAudioIdAtom,
	currentLyricsAtom,
	currentLyricsIndexAtom,
	currentRawLyricRespAtom,
	musicIdAtom,
	playStateAtom,
	songAliasNameAtom,
	songArtistsAtom,
	songNameAtom,
} from "../core/states";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { LyricPlayerTopBar } from "./lyric-player-topbar";
import { LyricPlayerFMControls } from "./lyric-player-fm-controls";
import { NoLyricOptions } from "./no-lyric-options";

export const LyricView: React.FC<{
	isFM?: boolean;
}> = (props) => {
	const isNowPlayingOpened = useNowPlayingOpened();
	const isFMOpened = useFMOpened();
	const currentAudioId = useAtomValue(currentAudioIdAtom);
	const currentAudioDuration = useAtomValue(currentAudioDurationAtom);
	const playState = useAtomValue(playStateAtom);
	const musicId = useAtomValue(musicIdAtom);
	const album = useAtomValue(albumAtom);
	const songName: string = useAtomValue(songNameAtom);
	const songAliasName: string[] = useAtomValue(songAliasNameAtom);
	const songArtists = useAtomValue(songArtistsAtom);

	const [error, setError] = React.useState<Error | null>(null);
	const currentLyrics = useAtomValue(currentLyricsAtom);
	const isLyricPageOpening = React.useMemo(() => {
		const o = props.isFM ? isFMOpened : isNowPlayingOpened;
		return o;
	}, [props.isFM, isNowPlayingOpened, isFMOpened]);

	const albumImageUrl = useAlbumImageUrl(musicId, 64, 64);

	const [currentLyricIndex, setCurrentLyricIndex] = useAtom(
		currentLyricsIndexAtom,
	);
	const lyricListElement = React.useRef<HTMLDivElement>(null);
	const keepSelectLyrics = React.useRef<Set<number>>(new Set());
	const [_, forceUpdate] = useForceUpdate();

	const configTranslatedLyric = useConfigValueBoolean("translated-lyric", true);
	const configDynamicLyric = useConfigValueBoolean("dynamic-lyric", false);
	const configRomanLyric = useConfigValueBoolean("roman-lyric", true);
	const alignTopSelectedLyric = useConfigValueBoolean(
		"alignTopSelectedLyric",
		false,
	);
	const [fullscreen, setFullscreen] = React.useState(
		document.webkitIsFullScreen as boolean,
	);

	React.useEffect(() => {
		if (document.webkitIsFullScreen !== fullscreen) {
			try {
				if (fullscreen) {
					document?.body?.webkitRequestFullScreen(
						Element?.["ALLOW_KEYBOARD_INPUT"],
					);
				} else {
					document?.exitFullscreen();
				}
			} catch {}
		}
	}, [fullscreen]);

	const scrollDelayRef = React.useRef(0);

	React.useEffect(() => {
		const onFullscreenChanged = () => {
			setFullscreen(document.webkitIsFullScreen as boolean);
		};
		document.addEventListener("fullscreenchange", onFullscreenChanged);
		return () => {
			document.removeEventListener("fullscreenchange", onFullscreenChanged);
		};
	}, []);

	const onLyricScroll = (evt: React.MouseEvent) => {
		scrollDelayRef.current = Date.now();
		log("滚动事件", evt);
	};

	const scrollTween = React.useRef<
		| {
				lyricElement: Element;
				tween: Tween<{ scrollTop: number }>;
		  }
		| undefined
	>(undefined);
	const forceScrollId = React.useRef(0);
	const scrollToLyric = React.useCallback(
		(mustScroll: boolean = false) => {
			if (lyricListElement.current) {
				const lyricView = lyricListElement.current.parentElement;
				let scrollToIndex = currentLyricIndex;
				for (const i of keepSelectLyrics.current) {
					if (scrollToIndex > i) {
						scrollToIndex = i;
					}
				}
				let lyricElement: HTMLElement | null =
					lyricListElement.current.children.item(scrollToIndex) as HTMLElement;
				if (lyricElement && lyricView) {
					if (mustScroll) {
						scrollTween.current = undefined;
					}
					if (lyricElement !== scrollTween.current?.lyricElement) {
						const listRect = lyricView.getBoundingClientRect();
						const lineRect = lyricElement.getBoundingClientRect();
						const lineHeight = lineRect.height;
						let scrollDelta = lineRect.top - listRect.top;
						if (!alignTopSelectedLyric) {
							scrollDelta -=
								(window.innerHeight - lineHeight) / 2 - listRect.top;
						} else if (lyricElement.innerText.trim().length > 0) {
							scrollDelta -= listRect.height * 0.1;
						} else {
							scrollDelta -= window.innerHeight * 0.06 + listRect.height * 0.1;
						}
						const prevScrollTop = lyricView.scrollTop;
						const obj = { scrollTop: prevScrollTop };

						if (mustScroll) {
							const id = ++forceScrollId.current;
							const onFrame = () => {
								if (
									lyricElement &&
									!scrollTween.current &&
									id === forceScrollId.current
								) {
									const listRect = lyricView.getBoundingClientRect();
									const lineRect = lyricElement.getBoundingClientRect();
									const prevScrollTop = lyricView.scrollTop;
									const lineHeight = lineRect.height;
									let scrollDelta = lineRect.top - listRect.top;
									if (!alignTopSelectedLyric) {
										scrollDelta -=
											(window.innerHeight - lineHeight) / 2 - listRect.top;
									} else if (lyricElement.innerText.trim().length > 0) {
										scrollDelta -= listRect.height * 0.1;
									} else {
										scrollDelta -=
											window.innerHeight * 0.06 + listRect.height * 0.1;
									}
									if (Math.abs(scrollDelta) > 10) {
										lyricView.scrollTo(0, prevScrollTop + scrollDelta);
										requestAnimationFrame(onFrame);
									}
								}
							};

							requestAnimationFrame(onFrame);
						} else {
							const tween = new Tween(obj)
								.to({ scrollTop: prevScrollTop + scrollDelta }, 750)
								.easing(Easing.Cubic.InOut)
								.onUpdate(() => {
									lyricView.scrollTo(0, obj.scrollTop);
								})
								.start();
							const onFrameUpdate = (time: number) => {
								if (scrollTween.current?.tween === tween) {
									scrollTween.current?.tween?.update(time);
									requestAnimationFrame(onFrameUpdate);
								} else {
									// log("动画被替换，旧动画已停止");
									scrollTween.current?.tween?.stop();
								}
							};
							scrollTween.current = {
								lyricElement,
								tween,
							};
							requestAnimationFrame(onFrameUpdate);
						}
					} else {
						// log("触发相同动画播放");
					}
				} else {
				}
			}
		},
		[currentLyricIndex, alignTopSelectedLyric],
	);

	const onSeekToLyric = React.useCallback(
		(line: LyricLine) => {
			scrollDelayRef.current = 0;
			if (currentLyrics) {
				const index = currentLyrics.findIndex((v) => v === line);
				keepSelectLyrics.current.clear();
				setCurrentLyricIndex(index);
			}
			if (
				configDynamicLyric &&
				(line.dynamicLyricTime ||
					currentAudioDuration < currentAudioDuration) &&
				(line.dynamicLyricTime || -1) >= 0
			) {
				log("正在跳转到歌词时间", line?.dynamicLyricTime || line.time);
				legacyNativeCmder._envAdapter.callAdapter(
					"audioplayer.seek",
					() => {},
					[
						currentAudioId,
						genAudioPlayerCommand(currentAudioId, "seek"),
						(line?.dynamicLyricTime || line.time) / 1000,
					],
				);
			} else if (line.time < currentAudioDuration && line.time >= 0) {
				log("正在跳转到歌词时间", line.time);
				legacyNativeCmder._envAdapter.callAdapter(
					"audioplayer.seek",
					() => {},
					[
						currentAudioId,
						genAudioPlayerCommand(currentAudioId, "seek"),
						line.time / 1000,
					],
				);
			}
		},
		[currentAudioId, configDynamicLyric, currentAudioDuration],
	);

	React.useEffect(() => {
		const btn = document.querySelector("a[data-action='max']");
		const onWindowSizeChanged = () => {
			scrollToLyric(true); // 触发歌词更新重新定位
		};
		const onLyricOpened = () => {
			log("歌词页面被打开！");
			keepSelectLyrics.current.clear();
			keepSelectLyrics.current.add(currentLyricIndex);
			scrollToLyric(true); // 触发歌词更新重新定位
		};

		GLOBAL_EVENTS.addEventListener("lyric-page-open", onLyricOpened);
		btn?.addEventListener("click", onLyricOpened);
		window.addEventListener("resize", onWindowSizeChanged);
		return () => {
			GLOBAL_EVENTS.removeEventListener("lyric-page-open", onLyricOpened);
			btn?.removeEventListener("click", onLyricOpened);
			window.removeEventListener("resize", onWindowSizeChanged);
		};
	}, [scrollToLyric, currentLyricIndex]);

	const lastUpdateTime = React.useRef(Date.now());
	const lastIndex = React.useRef(-1);

	const checkIfTooFast = React.useCallback(
		(currentLyricIndex: number) => {
			const lastLyricIndex = lastIndex.current;
			if (lastLyricIndex === currentLyricIndex || !currentLyrics) {
				return;
			}
			const changeTime = Date.now();
			const lastLine: LyricLine | undefined = currentLyrics[lastLyricIndex];
			const lastLyric = lastLine?.originalLyric || "";
			if (lastLyric.trim().length === 0) {
				keepSelectLyrics.current.clear();
				return;
			}
			// 预估的阅读时间
			const guessedLineReadTime = Math.min(
				2000,
				Math.max(750, guessTextReadDuration(lastLyric)),
			);
			if (
				lastLine &&
				changeTime - lastUpdateTime.current <= guessedLineReadTime
			) {
				if (keepSelectLyrics.current.size < 3) {
					keepSelectLyrics.current.add(lastLyricIndex);
				} else {
					if (keepSelectLyrics.current.size > 0)
						keepSelectLyrics.current.clear();
					lastUpdateTime.current = changeTime;
				}
				forceUpdate();
				keepSelectLyrics.current.add(currentLyricIndex);
			} else {
				lastUpdateTime.current = changeTime;
				if (keepSelectLyrics.current.size > 0) forceUpdate();
				keepSelectLyrics.current.clear();
			}
		},
		[currentLyrics],
	);

	React.useEffect(() => {
		return () => {
			lastIndex.current = currentLyricIndex;
		};
	}, [currentLyricIndex]);

	React.useEffect(() => {
		if (
			playState === PlayState.Playing &&
			Date.now() - scrollDelayRef.current > 2000
		) {
			checkIfTooFast(currentLyricIndex);
			scrollToLyric();
		} else {
			lastIndex.current = currentLyricIndex;
		}
	}, [
		scrollToLyric,
		checkIfTooFast,
		currentLyrics,
		currentLyricIndex,
		playState,
	]);

	React.useEffect(() => {
		scrollToLyric(true);
		scrollDelayRef.current = 0;
		keepSelectLyrics.current.clear();
	}, [
		configTranslatedLyric,
		configDynamicLyric,
		configRomanLyric,
		currentLyrics,
	]);

	const mapCurrentLyrics = React.useCallback(
		(line: LyricLine, index: number, lines: LyricLine[]) => {
			let isTooFast = keepSelectLyrics.current.has(index); // 如果歌词太快，我们就缓和一下
			const offset = index - currentLyricIndex;
			if (line.originalLyric.trim().length > 0) {
				return (
					<LyricLineView
						key={`${index}-${line.time}-${line.originalLyric}`}
						selected={index === currentLyricIndex || isTooFast}
						line={line}
						translated={configTranslatedLyric}
						dynamic={configDynamicLyric}
						roman={configRomanLyric}
						offset={offset}
						onClickLyric={onSeekToLyric}
					/>
				);
			} else {
				return (
					<LyricDots
						key={`${index}-dots`}
						selected={index === currentLyricIndex}
						time={line.time}
						offset={offset}
						duration={line.duration}
					/>
				);
			}
		},
		[
			onSeekToLyric,
			currentLyrics,
			currentLyricIndex,
			configDynamicLyric,
			configTranslatedLyric,
			configRomanLyric,
		],
	);

	React.useEffect(() => {
		if (fullscreen && isLyricPageOpening) {
			if ("RoundCornerNCM" in loadedPlugins) {
				betterncm.app.setRoundedCorner(false);
			}
			document.querySelector(".m-winctrl")?.classList.add("disabled");
		} else {
			if ("RoundCornerNCM" in loadedPlugins) {
				betterncm.app.setRoundedCorner(true);
			}
			document.querySelector(".m-winctrl")?.classList.remove("disabled");
		}
	}, [fullscreen, isLyricPageOpening]);

	React.useEffect(() => {
		() => {
			document.querySelector(".m-winctrl")?.classList.remove("disabled");
		};
	}, []);

	const [showBackground] = useConfigBoolean("showBackground", true);
	const [hideAlbumImage] = useConfigBoolean("hideAlbumImage", false);
	const [hideMusicName] = useConfigBoolean("hideMusicName", false);
	const [hideMusicAlias] = useConfigBoolean("hideMusicAlias", false);
	const [hideMusicArtists] = useConfigBoolean("hideMusicArtists", false);
	const [hideMusicAlbum] = useConfigBoolean("hideMusicAlbum", false);

	return (
		<>
			{showBackground && <LyricBackground musicId={musicId} />}
			{!(
				hideAlbumImage &&
				hideMusicName &&
				hideMusicAlias &&
				hideMusicArtists &&
				hideMusicAlbum
			) && (
				<div className="am-music-info">
					<div>
						{!hideAlbumImage && (
							<div className="am-album-image">
								<div>
									<LoadingOverlay
										loader={
											<Loader
												size={50}
												style={{ width: "50px", height: "50px" }}
											/>
										}
										sx={{
											borderRadius: "5%",
										}}
										visible={albumImageUrl.length === 0}
									/>
									<img
										alt="专辑图片"
										src={albumImageUrl}
										style={{
											opacity: albumImageUrl.length > 0 ? 1 : 0,
										}}
									/>
								</div>
							</div>
						)}
						{!hideMusicName && <div className="am-music-name">{songName}</div>}
						{!hideMusicAlias && songAliasName.length > 0 && (
							<div className="am-music-alias">
								{songAliasName.map((alia, index) => (
									<div key={`${alia}-${index}`}>{alia}</div>
								))}
							</div>
						)}
						{!hideMusicArtists && (
							<div className="am-music-artists">
								<div className="am-artists-label">歌手：</div>
								<div className="am-artists">
									{songArtists.map((artist, index) => (
										<a
											href={`#/m/artist/?id=${artist.id}`}
											key={`${artist.id}-${artist.name}-${index}`}
										>
											{artist.name}
										</a>
									))}
								</div>
							</div>
						)}
						{!hideMusicAlbum && album && (
							<div className="am-music-album">
								<div className="am-album-label">专辑：</div>
								<div className="am-album">
									<a href={`#/m/album/?id=${album?.id}`}>{album.name}</a>
								</div>
							</div>
						)}
						{props.isFM && <LyricPlayerFMControls />}
					</div>
				</div>
			)}
			<div className="am-lyric">
				<LyricPlayerTopBar
					isFullScreen={fullscreen}
					onSetFullScreen={(v) => setFullscreen(v)}
				/>
				{error ? (
					<div className="am-lyric-view-error">
						<div>歌词加载失败：</div>
						<div>{error.message}</div>
						<div>{error.stack}</div>
					</div>
				) : currentLyrics ? (
					currentLyrics.length > 0 ? (
						<div className="am-lyric-view" onWheel={onLyricScroll}>
							<div ref={lyricListElement}>
								{currentLyrics.map(mapCurrentLyrics)}
							</div>
						</div>
					) : (
						<NoLyricOptions onSetError={setError} />
					)
				) : (
					<Center className="am-lyric-view-loading">
						<Loader size={50} style={{ width: "50px", height: "50px" }} />
					</Center>
				)}
			</div>
		</>
	);
};

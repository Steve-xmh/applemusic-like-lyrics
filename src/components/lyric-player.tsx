import {
	useConfigBoolean,
	useFMOpened,
	useNowPlayingOpened,
} from "../api/react";
import * as React from "react";
import { Loader, Center } from "@mantine/core";
import { LyricBackground } from "./lyric-background";
import {
	adjustLyricOffsetModalOpenedAtom,
	albumAtom,
	albumImageUrlAtom,
	currentLyricsAtom,
	currentRawLyricRespAtom,
	lyricErrorAtom,
	musicIdAtom,
	rightClickedLyricAtom,
	selectLocalLyricModalOpenedAtom,
	selectMusicIdModalOpenedAtom,
	songArtistsAtom,
	songNameAtom,
	topbarMenuOpenedAtom,
	windowedConfigOpenedAtom,
} from "../core/states";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { NoLyricOptions } from "./no-lyric-options";
import { PlayerSongInfo } from "./song-info";
import { LyricRenderer } from "./lyric-renderer";
import { Menu, MenuDevider, MenuItem } from "./appkit/menu";
import { ModalsWrapper } from "./modals";
import {
	PURE_MUSIC_LYRIC_DATA,
	PURE_MUSIC_LYRIC_LINE,
} from "../core/lyric-parser";
import { getLyricCachePath, setClipboardData } from "../api";
import { WindowedConfigComponent } from "../config";
import exportTTMLText from "../core/ttml-writer";
import { isNCMV3 } from "../utils";
import { GLOBAL_EVENTS } from "../utils/global-events";

export const LyricView: React.FC<{
	isFM?: boolean;
}> = (props) => {
	const isNowPlayingOpened = useNowPlayingOpened();
	const isFMOpened = useFMOpened();
	const [windowedConfigOpened, setWindowedConfigOpened] = useAtom(
		windowedConfigOpenedAtom,
	);

	const error = useAtomValue(lyricErrorAtom);
	const currentLyrics = useAtomValue(currentLyricsAtom);
	const isLyricPageOpening = React.useMemo(() => {
		const o = props.isFM ? isFMOpened : isNowPlayingOpened;
		return o;
	}, [props.isFM, isNowPlayingOpened, isFMOpened]);
	const [fullscreen, setFullscreen] = React.useState(
		document.webkitIsFullScreen as boolean,
	);

	React.useEffect(() => {
		if (document?.webkitIsFullScreen !== fullscreen) {
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

	React.useEffect(() => {
		const onFullscreenChanged = () => {
			setFullscreen(document.webkitIsFullScreen as boolean);
		};
		document.addEventListener("fullscreenchange", onFullscreenChanged);
		return () => {
			document.removeEventListener("fullscreenchange", onFullscreenChanged);
		};
	}, []);

	React.useLayoutEffect(() => {
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

	const [showBackground] = useConfigBoolean("showBackground", true);

	return (
		<>
			{showBackground && <LyricBackground />}
			<PlayerSongInfo isFM={props.isFM} />
			<div className="am-lyric">
				{error ? (
					<div className="am-lyric-view-error">
						<div>歌词加载失败：</div>
						<div>{error.message}</div>
						<div>{error.stack}</div>
					</div>
				) : (
					<>
						<LyricRenderer />
						{!currentLyrics && (
							<Center className="am-lyric-view-loading">
								<Loader
									size={50}
									style={{
										width: "50px",
										height: "50px",
									}}
								/>
							</Center>
						)}
					</>
				)}
				{currentLyrics?.length === 0 && <NoLyricOptions />}
			</div>
			<ModalsWrapper />
			<MainMenu
				isFullScreen={fullscreen}
				onSetFullScreen={(v) => setFullscreen(v)}
			/>
			<RightClickLyricMenu />
			{windowedConfigOpened && (
				<WindowedConfigComponent
					onClose={() => setWindowedConfigOpened(false)}
				/>
			)}
		</>
	);
};

const MainMenu: React.FC<{
	isFullScreen: boolean;
	onSetFullScreen: (shouldFullScreent: boolean) => void;
}> = (props) => {
	const [menuOpened, setMenuOpened] = useAtom(topbarMenuOpenedAtom);
	const setWindowedConfigOpened = useSetAtom(windowedConfigOpenedAtom);
	const musicId = useAtomValue(musicIdAtom);
	const album = useAtomValue(albumAtom);
	const songName: string = useAtomValue(songNameAtom);
	const currentLyrics = useAtomValue(currentLyricsAtom);
	const songArtists = useAtomValue(songArtistsAtom);
	const albumImageUrl = useAtomValue(albumImageUrlAtom);
	const currentRawLyricResp = useAtomValue(currentRawLyricRespAtom);
	const setCurrentLyrics = useSetAtom(currentLyricsAtom);
	const setSelectMusicIdModalOpened = useSetAtom(selectMusicIdModalOpenedAtom);
	const setLocalLyricModalOpened = useSetAtom(selectLocalLyricModalOpenedAtom);
	const setAdjustLyricOffsetModalOpened = useSetAtom(
		adjustLyricOffsetModalOpenedAtom,
	);

	const [configTranslatedLyric, setConfigTranslatedLyric] = useConfigBoolean(
		"translated-lyric",
		true,
	);
	const [configDynamicLyric, setConfigDynamicLyric] = useConfigBoolean(
		"dynamic-lyric",
		false,
	);
	const [configRomanLyric, setConfigRomanLyric] = useConfigBoolean(
		"roman-lyric",
		true,
	);

	const isFavSong = React.useMemo(() => {
		return document
			.querySelector<HTMLDivElement>(".m-pinfo .btn.btn-love")
			?.classList.contains("loved");
	}, [menuOpened]);

	return (
		<Menu
			hasCheckBoxMenuItems
			opened={menuOpened}
			onClose={() => setMenuOpened(false)}
		>
			<MenuItem
				label={isFavSong ? "取消喜欢歌曲" : "喜欢歌曲"}
				onClick={() => {
					document
						.querySelector<HTMLDivElement>(".m-pinfo .btn.btn-love")
						?.click();
					setMenuOpened(false);
				}}
			/>
			<MenuItem
				label="收藏歌曲"
				onClick={() => {
					document
						.querySelector<HTMLDivElement>(".m-pinfo .btn.btn-fav")
						?.click();
					setMenuOpened(false);
				}}
			/>
			<MenuDevider />
			{songArtists.length === 1 && (
				<MenuItem
					label={`查看歌手：${songArtists[0].name}`}
					onClick={() => {
						location.hash = `#/m/artist/?id=${songArtists[0].id}`;
						setMenuOpened(false);
					}}
				/>
			)}
			{songArtists.length > 1 && (
				<MenuItem label="查看歌手...">
					{songArtists.map((a) => (
						<MenuItem
							label={a.name}
							key={`song-artist-${a.id}`}
							onClick={() => {
								location.hash = `#/m/artist/?id=${a.id}`;
								setMenuOpened(false);
							}}
						/>
					))}
				</MenuItem>
			)}
			{album && (
				<MenuItem
					label={`查看专辑：${album.name}`}
					onClick={() => {
						location.hash = `#/m/album/?id=${album?.id}`;
						setMenuOpened(false);
					}}
				/>
			)}
			<MenuItem label="复制音乐数据...">
				<MenuItem
					label={`复制音乐 ID：${musicId}`}
					onClick={() => {
						setClipboardData(String(musicId));
						setMenuOpened(false);
					}}
				/>
				<MenuItem
					label={`复制音乐名称：${songName}`}
					onClick={() => {
						setClipboardData(songName);
						setMenuOpened(false);
					}}
				/>
				{(currentRawLyricResp.lrc ||
					currentRawLyricResp.tlyric ||
					currentRawLyricResp.romalrc ||
					currentRawLyricResp.yrc ||
					currentRawLyricResp.yromalrc ||
					currentRawLyricResp.ytlrc) && (
					<MenuItem label="复制歌词源文件...">
						{currentRawLyricResp.lrc && (
							<MenuItem
								label="原文歌词文件 (Lrc)"
								onClick={() => {
									setClipboardData(currentRawLyricResp?.lrc?.lyric || "");
									setMenuOpened(false);
								}}
							/>
						)}
						{currentRawLyricResp.lrc && (
							<MenuItem
								label="翻译歌词文件 (TLyric)"
								onClick={() => {
									setClipboardData(currentRawLyricResp?.tlyric?.lyric || "");
									setMenuOpened(false);
								}}
							/>
						)}
						{currentRawLyricResp.romalrc && (
							<MenuItem
								label="音译歌词文件 (RomaLrc)"
								onClick={() => {
									setClipboardData(currentRawLyricResp?.romalrc?.lyric || "");
									setMenuOpened(false);
								}}
							/>
						)}
						{currentRawLyricResp.yrc && (
							<MenuItem
								label="逐词原文歌词文件 (Yrc)"
								onClick={() => {
									setClipboardData(currentRawLyricResp?.yrc?.lyric || "");
									setMenuOpened(false);
								}}
							/>
						)}
						{currentRawLyricResp.ytlrc && (
							<MenuItem
								label="逐词翻译歌词文件 (YTLrc)"
								onClick={() => {
									setClipboardData(currentRawLyricResp?.ytlrc?.lyric || "");
									setMenuOpened(false);
								}}
							/>
						)}
						{currentRawLyricResp.yromalrc && (
							<MenuItem
								label="逐词音译歌词文件 (YRomaLrc)"
								onClick={() => {
									setClipboardData(currentRawLyricResp?.yromalrc?.lyric || "");
									setMenuOpened(false);
								}}
							/>
						)}
					</MenuItem>
				)}
				{album && (
					<MenuItem
						label={`复制专辑名称：${album.name}`}
						onClick={() => {
							setClipboardData(album.name);
							setMenuOpened(false);
						}}
					/>
				)}
				{album && (
					<MenuItem
						label={`复制作者名称：${album.name}`}
						onClick={() => {
							setClipboardData(album.name);
							setMenuOpened(false);
						}}
					/>
				)}
				<MenuItem
					label="复制专辑图片链接"
					labelOnly={albumImageUrl === null}
					onClick={() => {
						// 去除缓存链接头
						let t = albumImageUrl;
						if (t) {
							if (t.startsWith("orpheus://cache/?")) {
								t = t.slice(17);
							}
							setClipboardData(t);
							setMenuOpened(false);
						}
					}}
				/>
				<MenuItem
					label="在浏览器打开专辑图片"
					labelOnly={albumImageUrl === null}
					onClick={() => {
						let t = albumImageUrl;
						if (t) {
							if (t.startsWith("orpheus://cache/?")) {
								t = t.slice(17);
							}
							betterncm.ncm.openUrl(t);
							setMenuOpened(false);
						}
					}}
				/>
			</MenuItem>
			<MenuDevider />
			<MenuItem
				label="显示翻译歌词"
				checked={configTranslatedLyric}
				onClick={() => {
					setConfigTranslatedLyric(!configTranslatedLyric);
					setMenuOpened(false);
				}}
			/>
			<MenuItem
				label="显示音译歌词"
				checked={configRomanLyric}
				onClick={() => {
					setConfigRomanLyric(!configRomanLyric);
					setMenuOpened(false);
				}}
			/>
			<MenuItem
				label="使用逐词歌词"
				checked={configDynamicLyric}
				onClick={() => {
					setConfigDynamicLyric(!configDynamicLyric);
					setMenuOpened(false);
				}}
			/>
			<MenuDevider />
			<MenuItem
				label="切换全屏模式"
				checked={props.isFullScreen}
				onClick={() => {
					props.onSetFullScreen(!props.isFullScreen);
					setMenuOpened(false);
				}}
			/>
			<MenuDevider />
			<MenuItem
				label="调整当前歌曲歌词时序位移"
				onClick={() => {
					setAdjustLyricOffsetModalOpened(true);
					setMenuOpened(false);
				}}
			/>
			<MenuItem label="更换当前歌曲歌词为...">
				<MenuItem
					label="网易云对应音乐 ID 的音乐"
					onClick={() => {
						setSelectMusicIdModalOpened(true);
						setMenuOpened(false);
					}}
				/>
				{/* <MenuItem
					label="网络搜索歌词文件"
					onClick={() => {
						setSelectMusicIdModalOpened(true);
						setMenuOpened(false);
					}}
				/> */}
				<MenuItem
					label="本地文件的歌词"
					onClick={() => {
						setLocalLyricModalOpened(true);
						setMenuOpened(false);
					}}
				/>
				<MenuItem
					label="纯音乐歌词"
					onClick={async () => {
						const lyricsPath = getLyricCachePath();
						const cachedLyricPath = `${lyricsPath}/${musicId}.json`;
						setCurrentLyrics(PURE_MUSIC_LYRIC_LINE);
						try {
							if (!(await betterncm.fs.exists(lyricsPath))) {
								betterncm.fs.mkdir(lyricsPath);
							}
							if (await betterncm.fs.exists(cachedLyricPath)) {
								await betterncm.fs.remove(cachedLyricPath);
							}
							await betterncm.fs.writeFile(
								cachedLyricPath,
								JSON.stringify(PURE_MUSIC_LYRIC_DATA, null, 4),
							);
						} catch {}
						setMenuOpened(false);
					}}
				/>
			</MenuItem>
			<MenuItem
				label="导出 TTML 歌词到剪切板"
				labelOnly={!currentLyrics}
				onClick={() => {
					if (currentLyrics) {
						try {
							setClipboardData(exportTTMLText(currentLyrics));
						} catch {}
						setMenuOpened(false);
					}
				}}
			/>
			<MenuDevider />
			<MenuItem
				label="Apple Music-like Lyric 插件设置..."
				onClick={() => {
					setWindowedConfigOpened(true);
					setMenuOpened(false);
				}}
			/>
			{isNCMV3() && (
				<>
					<MenuDevider />
					<MenuItem
						label="退出歌词页面"
						onClick={() => {
							GLOBAL_EVENTS.dispatchEvent(
								new Event("lyric-page-hide", undefined),
							);
							setMenuOpened(false);
						}}
					/>
				</>
			)}
		</Menu>
	);
};

const RightClickLyricMenu: React.FC = () => {
	const [configTranslatedLyric] = useConfigBoolean("translated-lyric", false);
	const [configRomanLyric] = useConfigBoolean("roman-lyric", false);
	const [configDynamicLyric] = useConfigBoolean("dynamic-lyric", false);
	const [rightClickedLyric, setRightClickedLyric] = useAtom(
		rightClickedLyricAtom,
	);
	return (
		<Menu
			opened={!!rightClickedLyric}
			onClose={() => setRightClickedLyric(null)}
		>
			<MenuItem
				label={
					rightClickedLyric
						? `复制原歌词：${
								configDynamicLyric
									? rightClickedLyric.dynamicLyric
											?.map((v) => v.word)
											?.join("") || rightClickedLyric.originalLyric
									: rightClickedLyric.originalLyric
						  }`
						: "未右键选中歌词"
				}
				onClick={() => {
					if (rightClickedLyric) {
						if (configDynamicLyric && rightClickedLyric.dynamicLyric) {
							setClipboardData(
								rightClickedLyric.dynamicLyric.map((v) => v.word).join(""),
							);
						} else {
							setClipboardData(rightClickedLyric.originalLyric);
						}
					}
					setRightClickedLyric(null);
				}}
			/>
			{configTranslatedLyric &&
				rightClickedLyric &&
				rightClickedLyric.translatedLyric && (
					<MenuItem
						label={`复制翻译歌词：${rightClickedLyric.translatedLyric}`}
						onClick={() => {
							setClipboardData(rightClickedLyric.translatedLyric || "");
							setRightClickedLyric(null);
						}}
					/>
				)}
			{configRomanLyric &&
				rightClickedLyric &&
				rightClickedLyric.romanLyric && (
					<MenuItem
						label={`复制音译歌词：${rightClickedLyric.romanLyric}`}
						onClick={() => {
							setClipboardData(rightClickedLyric.romanLyric || "");
							setRightClickedLyric(null);
						}}
					/>
				)}
			<MenuDevider />
			<MenuItem
				label="复制整行歌词"
				onClick={() => {
					if (rightClickedLyric) {
						let text = "";
						if (configDynamicLyric && rightClickedLyric.dynamicLyric) {
							text += rightClickedLyric.dynamicLyric
								.map((v) => v.word)
								.join("");
						} else {
							text += rightClickedLyric.originalLyric;
						}
						if (configTranslatedLyric && rightClickedLyric.translatedLyric) {
							text += "\n";
							text += rightClickedLyric.translatedLyric;
						}
						if (configRomanLyric && rightClickedLyric.romanLyric) {
							text += "\n";
							text += rightClickedLyric.romanLyric;
						}
						setClipboardData(text.trim());
					}
					setRightClickedLyric(null);
				}}
			/>
		</Menu>
	);
};

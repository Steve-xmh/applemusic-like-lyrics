import {
	useConfig,
	useConfigBoolean,
	useFMOpened,
	useNowPlayingOpened,
} from "../api/react";
import * as React from "react";
import { Loader, Center } from "@mantine/core";
import { LyricBackground } from "./lyric-background";
import {
	adjustLyricOffsetModalOpenedAtom,
	currentLyricsAtom,
	lyricErrorAtom,
	musicIdAtom,
	rightClickedLyricAtom,
	selectLocalLyricModalOpenedAtom,
	selectMusicIdModalOpenedAtom,
	topbarMenuOpenedAtom,
} from "../core/states";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { LyricPlayerTopBar } from "./lyric-player-topbar";
import { NoLyricOptions } from "./no-lyric-options";
import { PlayerSongInfo, PlayerSongInfoMenuContent } from "./song-info";
import { LyricRenderer, RendererBackend } from "./lyric-renderer";
import { Menu, MenuDevider, MenuItem } from "./appkit/menu";
import { ModalsWrapper } from "./modals";
import {
	PURE_MUSIC_LYRIC_DATA,
	PURE_MUSIC_LYRIC_LINE,
} from "../core/lyric-parser";
import { setClipboardData } from "../api";

export const LyricView: React.FC<{
	isFM?: boolean;
}> = (props) => {
	const isNowPlayingOpened = useNowPlayingOpened();
	const isFMOpened = useFMOpened();

	const error = useAtomValue(lyricErrorAtom);
	const currentLyrics = useAtomValue(currentLyricsAtom);
	const isLyricPageOpening = React.useMemo(() => {
		const o = props.isFM ? isFMOpened : isNowPlayingOpened;
		return o;
	}, [props.isFM, isNowPlayingOpened, isFMOpened]);
	const [fullscreen, setFullscreen] = React.useState(
		document.webkitIsFullScreen as boolean,
	);
	const [rendererBackend] = useConfig("rendererBackend", RendererBackend.DOM);

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
				<LyricPlayerTopBar />
				{error ? (
					<div className="am-lyric-view-error">
						<div>?????????????????????</div>
						<div>{error.message}</div>
						<div>{error.stack}</div>
					</div>
				) : currentLyrics ? (
					currentLyrics.length > 0 ? (
						<LyricRenderer backend={rendererBackend as RendererBackend} />
					) : (
						<NoLyricOptions />
					)
				) : (
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
			</div>
			<ModalsWrapper />
			<TopBarMenu
				isFullScreen={fullscreen}
				onSetFullScreen={(v) => setFullscreen(v)}
			/>
			<RightClickLyricMenu />
		</>
	);
};

const TopBarMenu: React.FC<{
	isFullScreen: boolean;
	onSetFullScreen: (shouldFullScreent: boolean) => void;
}> = (props) => {
	const [menuOpened, setMenuOpened] = useAtom(topbarMenuOpenedAtom);
	const musicId = useAtomValue(musicIdAtom);
	const setCurrentLyrics = useSetAtom(currentLyricsAtom);
	const setSelectMusicIdModalOpened = useSetAtom(selectMusicIdModalOpenedAtom);
	const setLocalLyricModalOpened = useSetAtom(selectLocalLyricModalOpenedAtom);
	const setAdjustLyricOffsetModalOpened = useSetAtom(
		adjustLyricOffsetModalOpenedAtom,
	);

	const [hideAlbumImage] = useConfigBoolean("hideAlbumImage", false);
	const [hideMusicName] = useConfigBoolean("hideMusicName", false);
	const [hideMusicAlias] = useConfigBoolean("hideMusicAlias", false);
	const [hideMusicArtists] = useConfigBoolean("hideMusicArtists", false);
	const [hideMusicAlbum] = useConfigBoolean("hideMusicAlbum", false);
	const isPlayerSongInfoHidden =
		hideAlbumImage &&
		hideMusicName &&
		hideMusicAlias &&
		hideMusicArtists &&
		hideMusicAlbum;

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

	return (
		<Menu
			hasCheckBoxMenuItems
			opened={menuOpened}
			onClose={() => setMenuOpened(false)}
		>
			{isPlayerSongInfoHidden && (
				<>
					<PlayerSongInfoMenuContent onCloseMenu={() => setMenuOpened(false)} />
					<MenuDevider />
				</>
			)}
			<MenuItem
				label="??????????????????"
				checked={configTranslatedLyric}
				onClick={() => {
					setConfigTranslatedLyric(!configTranslatedLyric);
					setMenuOpened(false);
				}}
			/>
			<MenuItem
				label="??????????????????"
				checked={configRomanLyric}
				onClick={() => {
					setConfigRomanLyric(!configRomanLyric);
					setMenuOpened(false);
				}}
			/>
			<MenuItem
				label="??????????????????"
				checked={configDynamicLyric}
				onClick={() => {
					setConfigDynamicLyric(!configDynamicLyric);
					setMenuOpened(false);
				}}
			/>
			<MenuDevider />
			<MenuItem
				label="??????????????????"
				checked={props.isFullScreen}
				onClick={() => {
					props.onSetFullScreen(!props.isFullScreen);
					setMenuOpened(false);
				}}
			/>
			<MenuDevider />
			<MenuItem
				label="????????????????????????????????????"
				onClick={() => {
					setAdjustLyricOffsetModalOpened(true);
					setMenuOpened(false);
				}}
			/>
			<MenuItem label="???????????????????????????...">
				<MenuItem
					label="????????????????????? ID ?????????"
					onClick={() => {
						setSelectMusicIdModalOpened(true);
						setMenuOpened(false);
					}}
				/>
				{/* <MenuItem
					label="????????????????????????"
					onClick={() => {
						setSelectMusicIdModalOpened(true);
						setMenuOpened(false);
					}}
				/> */}
				<MenuItem
					label="?????????????????????"
					onClick={() => {
						setLocalLyricModalOpened(true);
						setMenuOpened(false);
					}}
				/>
				<MenuItem
					label="???????????????"
					onClick={async () => {
						const lyricsPath = `${plugin.pluginPath}/lyrics`;
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
			<MenuDevider />
			<MenuItem
				label="Apple Music-like Lyric ????????????..."
				onClick={() => {
					if (!document.querySelector(".better-ncm-manager.g-mn.ncmm-show"))
						document
							.querySelector<HTMLDivElement>("a[title=BetterNCM]")
							?.click();
					document.querySelector<HTMLDivElement>("[data-action=min]")?.click();
					document
						.querySelector<HTMLDivElement>(
							`.better-ncm-manager .loaded-plugins-list .plugin-btn[data-plugin-slug='${plugin.manifest.slug}']`,
						)
						?.click();
					setMenuOpened(false);
				}}
			/>
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
						? `??????????????????${
								configDynamicLyric
									? rightClickedLyric.dynamicLyric
											?.map((v) => v.word)
											?.join("") || rightClickedLyric.originalLyric
									: rightClickedLyric.originalLyric
						  }`
						: "?????????????????????"
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
						label={`?????????????????????${rightClickedLyric.translatedLyric}`}
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
						label={`?????????????????????${rightClickedLyric.romanLyric}`}
						onClick={() => {
							setClipboardData(rightClickedLyric.romanLyric || "");
							setRightClickedLyric(null);
						}}
					/>
				)}
			<MenuDevider />
			<MenuItem
				label="??????????????????"
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

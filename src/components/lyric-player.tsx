import {
	useConfig,
	useConfigBoolean,
	useFMOpened,
	useNowPlayingOpened,
} from "../api/react";
import * as React from "react";
import { Loader, Center } from "@mantine/core";
import { LyricBackground } from "./lyric-background";
import { currentLyricsAtom, rightClickedLyricAtom } from "../core/states";
import { useAtom, useAtomValue } from "jotai";
import { LyricPlayerTopBar } from "./lyric-player-topbar";
import { NoLyricOptions } from "./no-lyric-options";
import { PlayerSongInfo } from "./song-info";
import { LyricRenderer, RendererBackend } from "./lyric-renderer";
import { Menu, MenuDevider, MenuItem } from "./appkit/menu";

export const LyricView: React.FC<{
	isFM?: boolean;
}> = (props) => {
	const isNowPlayingOpened = useNowPlayingOpened();
	const isFMOpened = useFMOpened();

	const [error, setError] = React.useState<Error | null>(null);
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

	React.useEffect(() => {
		const onFullscreenChanged = () => {
			setFullscreen(document.webkitIsFullScreen as boolean);
		};
		document.addEventListener("fullscreenchange", onFullscreenChanged);
		return () => {
			document.removeEventListener("fullscreenchange", onFullscreenChanged);
		};
	}, []);

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

	const [showBackground] = useConfigBoolean("showBackground", true);

	return (
		<>
			{showBackground && <LyricBackground />}
			<PlayerSongInfo isFM={props.isFM} />
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
						<LyricRenderer backend={rendererBackend as RendererBackend} />
					) : (
						<NoLyricOptions onSetError={setError} />
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
			<RightClickLyricMenu />
		</>
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
						? configDynamicLyric
							? rightClickedLyric.dynamicLyric?.map((v) => v.word)?.join("") ||
							  rightClickedLyric.originalLyric
							: rightClickedLyric.originalLyric
						: "未右键选中歌词"
				}
				labelOnly
			/>
			{configTranslatedLyric &&
				rightClickedLyric &&
				rightClickedLyric.translatedLyric && (
					<MenuItem label={rightClickedLyric.translatedLyric} labelOnly />
				)}
			{configRomanLyric &&
				rightClickedLyric &&
				rightClickedLyric.romanLyric && (
					<MenuItem label={rightClickedLyric.romanLyric} labelOnly />
				)}
			<MenuDevider />
			<MenuItem
				label="复制歌词"
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
						legacyNativeCmder._envAdapter.callAdapter(
							"winhelper.setClipBoardData",
							() => {},
							[text.trim()],
						);
					}
					setRightClickedLyric(null);
				}}
			/>
		</Menu>
	);
};

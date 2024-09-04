import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { Menu, MenuDevider, MenuItem } from "../../components/appkit/menu";
import {
	showRomanLineAtom,
	showTranslatedLineAtom,
} from "../../components/config/atoms";
import { FC, useMemo } from "react";
import {
	musicAlbumIdAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicContextAtom,
	musicCoverAtom,
	musicIdAtom,
	musicNameAtom,
	setClipboardAtom,
} from "../../music-context/wrapper";
import {
	AMLLEnvironment,
	amllEnvironmentAtom,
	closeLyricPage,
} from "../../injector";
import { amllConfigWindowedOpenedAtom } from "../../components/config";
import { musicOverrideWindowOpenedAtom } from "./music-override-window";

export const topbarMenuOpenedAtom = atom(false);
const isFullscreenAtom = atom(false);

export const MainMenu: FC = () => {
	const [menuOpened, setMenuOpened] = useAtom(topbarMenuOpenedAtom);
	const musicName = useAtomValue(musicNameAtom);
	const artists = useAtomValue(musicArtistsAtom);
	const musicId = useAtomValue(musicIdAtom);
	const albumId = useAtomValue(musicAlbumIdAtom);
	const albumName = useAtomValue(musicAlbumNameAtom);
	const musicCover = useAtomValue(musicCoverAtom);
	const amllEnvironment = useAtomValue(amllEnvironmentAtom);
	const setWindowedConfigOpened = useSetAtom(amllConfigWindowedOpenedAtom);
	const setClipboardData = useSetAtom(setClipboardAtom);
	const setMusicOverrideWindowOpened = useSetAtom(
		musicOverrideWindowOpenedAtom,
	);
	const musicCtx = useAtomValue(musicContextAtom);

	const [configTranslatedLyric, setConfigTranslatedLyric] = useAtom(
		showTranslatedLineAtom,
	);
	const [configRomanLyric, setConfigRomanLyric] = useAtom(showRomanLineAtom);
	const [isFullscreen, setFullscreen] = useAtom(isFullscreenAtom);

	const isFavSong = useMemo(() => {
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
						.querySelector<HTMLButtonElement>(
							"footer .left button:nth-child(1)",
						)
						?.click();
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
			{artists.length === 1 && (
				<MenuItem
					label={`查看歌手：${artists[0].name}`}
					onClick={() => {
						location.hash = `#/m/artist/?id=${artists[0].id}`;
						setMenuOpened(false);
					}}
				/>
			)}
			{artists.length > 1 && (
				<MenuItem label="查看歌手...">
					{artists.map((a) => (
						<MenuItem
							label={a.name}
							key={`song-artist-${a.id}`}
							onClick={() => {
								location.hash = `#/m/artist/?id=${a.id}`; // TODO: 解耦
								setMenuOpened(false);
							}}
						/>
					))}
				</MenuItem>
			)}
			{albumName && albumId && (
				<MenuItem
					label={`查看专辑：${albumName}`}
					onClick={() => {
						location.hash = `#/m/album/?id=${albumId}`;
						setMenuOpened(false);
						closeLyricPage();
					}}
				/>
			)}
			<MenuItem label="复制音乐数据...">
				{musicId && (
					<MenuItem
						label={`复制音乐 ID：${musicId}`}
						onClick={() => {
							setClipboardData(String(musicId));
							setMenuOpened(false);
						}}
					/>
				)}
				<MenuItem
					label={`复制音乐名称：${musicName}`}
					onClick={() => {
						setClipboardData(musicName);
						setMenuOpened(false);
					}}
				/>
				{/* {(currentRawLyricResp.lrc ||
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
				)} */}
				{albumName && (
					<MenuItem
						label={`复制专辑名称：${albumName}`}
						onClick={() => {
							setClipboardData(albumName);
							setMenuOpened(false);
						}}
					/>
				)}
				{artists.length > 0 && (
					<MenuItem
						label={`复制作者名称：${artists.map((v) => v.name).join()}`}
						onClick={() => {
							setClipboardData(artists.map((v) => v.name).join());
							setMenuOpened(false);
						}}
					/>
				)}
				<MenuItem
					label="复制专辑图片链接"
					labelOnly={musicCover === null}
					onClick={() => {
						// 去除缓存链接头
						let t = musicCover;
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
					labelOnly={musicCover === null}
					onClick={() => {
						let t = musicCover;
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
			<MenuItem
				label="编辑音乐数据"
				onClick={() => {
					setMusicOverrideWindowOpened(true);
					setMenuOpened(false);
				}}
			/>
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
			<MenuDevider />
			<MenuItem
				label="切换全屏模式"
				checked={isFullscreen}
				onClick={() => {
					setFullscreen((v) => {
						musicCtx?.setFullscreen(!v);
						return !v;
					});
					setMenuOpened(false);
				}}
			/>
			<MenuDevider />
			{amllEnvironment === AMLLEnvironment.BetterNCM && (
				<>
					<MenuItem
						label="Apple Music-like Lyric 插件设置..."
						onClick={() => {
							setWindowedConfigOpened(true);
							setMenuOpened(false);
						}}
					/>
					<MenuDevider />
					<MenuItem
						label="退出歌词页面"
						onClick={() => {
							setMenuOpened(false);
							closeLyricPage();
						}}
					/>
				</>
			)}
			{amllEnvironment === AMLLEnvironment.AMLLPlayer && (
				<MenuItem
					label="AMLL Player 设置..."
					onClick={() => {
						setWindowedConfigOpened(true);
						setMenuOpened(false);
					}}
				/>
			)}
			{amllEnvironment === AMLLEnvironment.Component && (
				<MenuItem
					label="AMLL 播放页面设置..."
					onClick={() => {
						setWindowedConfigOpened(true);
						setMenuOpened(false);
					}}
				/>
			)}
		</Menu>
	);
};

const RightClickLyricMenu: FC = () => {
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

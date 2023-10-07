import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { Button } from "../../components/appkit/button";
import { TextField } from "../../components/appkit/text-field";
import { AppKitWindow, SidebarItem } from "../../components/appkit/window";
import "./music-override-window.sass";
import {
	MusicOverrideData,
	loadableMusicOverrideDataAtom,
	musicArtistsAtom,
	musicIdAtom,
	musicNameAtom,
	musicOverrideDataAtom,
} from "../../music-context/wrapper";
import { type FC, useLayoutEffect } from "react";
import { Switch } from "../../components/appkit/switch/switch";
import { loadable, useAtomCallback } from "jotai/utils";
import { getLyric } from "../../lyric/provider";
import "./music-override-window.sass";

type Page = "music-info" | "lyric-info" | "override-lyric";

export const musicOverrideWindowOpenedAtom = atom(false);
const musicOverrideWindowPageAtom = atom("music-info" as Page);
const musicOverrideSavingAtom = atom(false);
const shouldDisableAtom = atom(
	(get) =>
		get(loadableMusicOverrideDataAtom).state === "loading" ||
		get(musicOverrideSavingAtom),
);
const overrideMusicNameAtom = atom("");
const overrideMusicArtistsAtom = atom("");
const overrideMusicCoverUrlAtom = atom("");
const overrideCoverIsVideoAtom = atom(false);
const overrideLyricOffsetAtom = atom(0);

const rawMusicInfoAtom = loadable(
	atom((get) => {
		const musicId = get(musicIdAtom);
		return getLyric(musicId);
	}),
);

const MusicInfoPage: FC = () => {
	const musicOverrideWindowOpened = useAtomValue(musicOverrideWindowOpenedAtom);
	const musicOverrideData = useAtomValue(loadableMusicOverrideDataAtom);
	const [overrideMusicName, setOverrideMusicName] = useAtom(
		overrideMusicNameAtom,
	);
	const [overrideMusicArtists, setOverrideMusicArtists] = useAtom(
		overrideMusicArtistsAtom,
	);
	const [overrideMusicCoverUrl, setOverrideMusicCoverUrl] = useAtom(
		overrideMusicCoverUrlAtom,
	);
	const [overrideCoverIsVideo, setOverrideCoverIsVideo] = useAtom(
		overrideCoverIsVideoAtom,
	);
	const saving = useAtomValue(musicOverrideSavingAtom);
	useLayoutEffect(() => {
		if (musicOverrideWindowOpened && musicOverrideData.state === "hasData") {
			setOverrideMusicName(musicOverrideData.data.musicName || "");
			setOverrideMusicArtists(musicOverrideData.data.musicArtists || "");
			setOverrideMusicCoverUrl(musicOverrideData.data.musicCoverUrl || "");
			setOverrideCoverIsVideo(
				musicOverrideData.data.musicCoverIsVideo || false,
			);
		} else {
			setOverrideMusicName("");
			setOverrideMusicArtists("");
			setOverrideMusicCoverUrl("");
			setOverrideCoverIsVideo(false);
		}
	}, [musicOverrideWindowOpened, musicOverrideData.state]);
	const shouldDisable = saving || musicOverrideData.state === "loading";

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "1em",
				paddingRight: "1em",
			}}
		>
			<div>
				<TextField
					style={{ width: "100%", boxSizing: "border-box" }}
					label="歌曲名"
					placeholder="留空以保持默认"
					disabled={shouldDisable}
					value={overrideMusicName}
					onChange={(e) => setOverrideMusicName(e.currentTarget.value)}
				/>
				<TextField
					style={{ width: "100%", boxSizing: "border-box" }}
					label="歌手名"
					placeholder="留空以保持默认"
					disabled={shouldDisable}
					value={overrideMusicArtists}
					onChange={(e) => setOverrideMusicArtists(e.currentTarget.value)}
				/>
				<div
					style={{
						display: "flex",
						gap: "1em",
					}}
				>
					<div style={{ flex: "1" }}>
						{overrideMusicCoverUrl.length < 1024 ? (
							<TextField
								style={{ width: "100%", boxSizing: "border-box" }}
								label="专辑图片链接"
								placeholder="留空以保持默认"
								value={overrideMusicCoverUrl}
								disabled={shouldDisable}
								onChange={(e) =>
									setOverrideMusicCoverUrl(e.currentTarget.value)
								}
							/>
						) : (
							<div>图片较大，请直接更换图片或还原</div>
						)}
						<Button
							style={{ marginBlock: "0.5em" }}
							disabled={shouldDisable}
							onClick={() => {
								const inputEl = document.createElement("input");
								inputEl.type = "file";
								inputEl.accept = "image/*";
								inputEl.onchange = () => {
									const file = inputEl.files?.[0];
									if (!file) return;
									// Read and turn into a base64 uri
									const reader = new FileReader();
									reader.onload = () => {
										const dataUrl = reader.result;
										if (typeof dataUrl !== "string") return;
										setOverrideMusicCoverUrl(dataUrl);
									};
									reader.readAsDataURL(file);
								};
								inputEl.click();
							}}
						>
							打开本地图片
						</Button>
						<Switch
							disabled={shouldDisable}
							selected={overrideCoverIsVideo}
							onClick={() => setOverrideCoverIsVideo(!overrideCoverIsVideo)}
							beforeSwitch={
								<div>专题图格式为视频（警告：在网易云上不支持视频解码）</div>
							}
						/>
					</div>
					<div>
						<div style={{ marginBlock: "0.5em" }}>专辑图片示例</div>
						{overrideCoverIsVideo ? (
							<div
								style={{
									width: "100px",
									height: "100px",
									aspectRatio: "1/1",
									overflow: "hidden",
									border: "1px solid #ccc7",
									borderRadius: "4px",
								}}
							>
								<video
									playsInline
									autoPlay
									loop
									muted
									preload="auto"
									crossOrigin="anonymous"
									style={{
										width: "100%",
										height: "100%",
										objectPosition: "center",
										objectFit: "cover",
									}}
									src={overrideMusicCoverUrl}
								/>
							</div>
						) : (
							<div
								style={{
									width: "100px",
									height: "100px",
									aspectRatio: "1/1",
									background: "white",
									backgroundImage: `url(${overrideMusicCoverUrl})`,
									backgroundPosition: "center",
									backgroundSize: "cover",
									border: "1px solid #ccc7",
									borderRadius: "4px",
								}}
							/>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

const RawLyricInfoPage: FC = () => {
	const rawMusicInfo = useAtomValue(rawMusicInfoAtom);
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "1em",
				paddingRight: "1em",
			}}
		>
			{rawMusicInfo.state === "loading" && <div>加载中</div>}
			{rawMusicInfo.state === "hasError" && (
				<>
					<div>加载出错，请切歌重试</div>
					<div>{String(rawMusicInfo.error)}</div>
				</>
			)}
			{rawMusicInfo.state === "hasData" && (
				<>
					<div>原文歌词</div>
					<textarea
						className="raw-lyric-info-textarea"
						readOnly
						value={rawMusicInfo.data.lrc?.lyric || ""}
					/>
					<div>翻译歌词</div>
					<textarea
						className="raw-lyric-info-textarea"
						readOnly
						value={rawMusicInfo.data.tlyric?.lyric || ""}
					/>
					<div>音译歌词</div>
					<textarea
						className="raw-lyric-info-textarea"
						readOnly
						value={rawMusicInfo.data.romalrc?.lyric || ""}
					/>
					<div>逐词原文歌词</div>
					<textarea
						className="raw-lyric-info-textarea"
						readOnly
						value={rawMusicInfo.data.yrc?.lyric || ""}
					/>
					<div>逐词翻译歌词</div>
					<textarea
						className="raw-lyric-info-textarea"
						readOnly
						value={rawMusicInfo.data.ytlrc?.lyric || ""}
					/>
					<div>逐词音译歌词</div>
					<textarea
						className="raw-lyric-info-textarea"
						readOnly
						value={rawMusicInfo.data.yromalrc?.lyric || ""}
					/>
				</>
			)}
		</div>
	);
};

const LyricAdjectPage: FC = () => {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "1em",
				paddingRight: "1em",
			}}
		>
			施工中
		</div>
	);
};

export const MusicOverrideWindow: FC = () => {
	const musicName = useAtomValue(musicNameAtom);
	const musicArtists = useAtomValue(musicArtistsAtom);
	const [musicOverrideWindowOpened, setMusicOverrideWindowOpened] = useAtom(
		musicOverrideWindowOpenedAtom,
	);
	const shouldDisable = useAtomValue(shouldDisableAtom);
	const [musicOverrideWindowPage, setMusicOverrideWindowPage] = useAtom(
		musicOverrideWindowPageAtom,
	);
	const setSaving = useSetAtom(musicOverrideSavingAtom);
	const setMusicOverrideData = useSetAtom(musicOverrideDataAtom);

	const saveOverrideData = useAtomCallback(async (get, set) => {
		set(musicOverrideSavingAtom, true);
		const overrideMusicName = get(overrideMusicNameAtom);
		const overrideMusicArtists = get(overrideMusicArtistsAtom);
		const overrideMusicCoverUrl = get(overrideMusicCoverUrlAtom);
		const overrideCoverIsVideo = get(overrideCoverIsVideoAtom);

		const data: Partial<MusicOverrideData> = {
			musicName: overrideMusicName || undefined,
			musicArtists: overrideMusicArtists || undefined,
			musicCoverUrl: overrideMusicCoverUrl || undefined,
			musicCoverIsVideo: overrideCoverIsVideo || undefined,
		};
		await set(musicOverrideDataAtom, data);
		set(musicOverrideSavingAtom, false);
	});

	return (
		<AppKitWindow
			width={600}
			height={400}
			open={musicOverrideWindowOpened}
			sidebarItems={
				<>
					<SidebarItem
						onClick={() => setMusicOverrideWindowPage("music-info")}
						selected={musicOverrideWindowPage === "music-info"}
					>
						音乐基本信息
					</SidebarItem>
					<SidebarItem
						onClick={() => setMusicOverrideWindowPage("lyric-info")}
						selected={musicOverrideWindowPage === "lyric-info"}
					>
						原始歌词信息
					</SidebarItem>
					<SidebarItem
						onClick={() => setMusicOverrideWindowPage("override-lyric")}
						selected={musicOverrideWindowPage === "override-lyric"}
					>
						歌词替换或微调
					</SidebarItem>
				</>
			}
			sidebarBottomItems={
				<>
					<SidebarItem>
						<Button
							style={{
								width: "100%",
								boxSizing: "border-box",
							}}
							disabled={shouldDisable}
							onClick={async () => {
								setSaving(true);
								setMusicOverrideData({});
								setSaving(false);
							}}
						>
							全部还原默认
						</Button>
					</SidebarItem>
					<SidebarItem>
						<Button
							accent
							style={{
								width: "100%",
								boxSizing: "border-box",
							}}
							disabled={shouldDisable}
							onClick={saveOverrideData}
						>
							保存并更新
						</Button>
					</SidebarItem>
				</>
			}
			onClose={() => setMusicOverrideWindowOpened(false)}
			title={`编辑音乐数据：${musicArtists
				.map((v) => v.name)
				.join(", ")} - ${musicName}`}
		>
			{musicOverrideWindowPage === "music-info" && <MusicInfoPage />}
			{musicOverrideWindowPage === "lyric-info" && <RawLyricInfoPage />}
			{musicOverrideWindowPage === "override-lyric" && <LyricAdjectPage />}
		</AppKitWindow>
	);
};

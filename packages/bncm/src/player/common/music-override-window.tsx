import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { Button } from "../../components/appkit/button";
import { TextField } from "../../components/appkit/text-field";
import { AppKitWindow, SidebarItem } from "../../components/appkit/window";
import "./music-override-window.sass";
import {
	LyricOverrideType,
	MusicOverrideData,
	loadableMusicOverrideDataAtom,
	musicArtistsAtom,
	musicIdAtom,
	musicNameAtom,
	musicOverrideDataAtom,
	newOverrideData,
} from "../../music-context/wrapper";
import { type FC, useLayoutEffect } from "react";
import { Switch } from "../../components/appkit/switch/switch";
import { loadable, useAtomCallback } from "jotai/utils";
import { getLyricFromNCMAtom } from "../../lyric/provider";
import "./music-override-window.sass";
import { Select } from "../../components/appkit/select";
import { focusAtom } from "../../utils/atom-focus";

type Page = "music-info" | "lyric-info" | "override-lyric";

export const musicOverrideWindowOpenedAtom = atom(false);
const musicOverrideWindowPageAtom = atom("music-info" as Page);
const musicOverrideSavingAtom = atom(false);
const shouldDisableAtom = atom(
	(get) =>
		get(loadableMusicOverrideDataAtom).state === "loading" ||
		get(musicOverrideSavingAtom),
);
const editingMusicOverrideDataAtom = atom(newOverrideData());
const overrideMusicNameAtom = focusAtom(
	editingMusicOverrideDataAtom,
	"musicName",
);
const overrideMusicArtistsAtom = focusAtom(
	editingMusicOverrideDataAtom,
	"musicArtists",
);
const overrideMusicCoverUrlAtom = focusAtom(
	editingMusicOverrideDataAtom,
	"musicCoverUrl",
);
const overrideCoverIsVideoAtom = focusAtom(
	editingMusicOverrideDataAtom,
	"musicCoverIsVideo",
);
const overrideLyricOffsetAtom = focusAtom(
	editingMusicOverrideDataAtom,
	"lyricOffset",
);
const overrideLyricOverrideTypeAtom = focusAtom(
	editingMusicOverrideDataAtom,
	"lyricOverrideType",
);
const overrideLyricOverrideMusicIdAtom = focusAtom(
	editingMusicOverrideDataAtom,
	"lyricOverrideMusicId",
);
const overrideLyricOverrideOriginalLyricDataAtom = focusAtom(
	editingMusicOverrideDataAtom,
	"lyricOverrideOriginalLyricData",
);
const overrideLyricOverrideTranslatedLyricDataAtom = focusAtom(
	editingMusicOverrideDataAtom,
	"lyricOverrideTranslatedLyricData",
);
const overrideLyricOverrideRomanLyricDataAtom = focusAtom(
	editingMusicOverrideDataAtom,
	"lyricOverrideRomanLyricData",
);

const rawMusicInfoAtom = loadable(
	atom((get) => {
		const musicId = get(musicIdAtom);
		const { getLyric } = get(getLyricFromNCMAtom);
		return getLyric(musicId);
	}),
);

const MusicInfoPage: FC = () => {
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
	const shouldDisable = useAtomValue(shouldDisableAtom);

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
						value={rawMusicInfo?.data?.lrc?.lyric || ""}
					/>
					<div>翻译歌词</div>
					<textarea
						className="raw-lyric-info-textarea"
						readOnly
						value={rawMusicInfo?.data?.tlyric?.lyric || ""}
					/>
					<div>音译歌词</div>
					<textarea
						className="raw-lyric-info-textarea"
						readOnly
						value={rawMusicInfo?.data?.romalrc?.lyric || ""}
					/>
					<div>逐词原文歌词</div>
					<textarea
						className="raw-lyric-info-textarea"
						readOnly
						value={rawMusicInfo?.data?.yrc?.lyric || ""}
					/>
					<div>逐词翻译歌词</div>
					<textarea
						className="raw-lyric-info-textarea"
						readOnly
						value={rawMusicInfo?.data?.ytlrc?.lyric || ""}
					/>
					<div>逐词音译歌词</div>
					<textarea
						className="raw-lyric-info-textarea"
						readOnly
						value={rawMusicInfo?.data?.yromalrc?.lyric || ""}
					/>
				</>
			)}
		</div>
	);
};

const LyricAdjectPage: FC = () => {
	const [overrideLyricOffset, setOverrideLyricOffset] = useAtom(
		overrideLyricOffsetAtom,
	);
	const [overrideLyricOverrideType, setOverrideLyricOverrideType] = useAtom(
		overrideLyricOverrideTypeAtom,
	);
	const [overrideLyricOverrideMusicId, setOverrideLyricOverrideMusicId] =
		useAtom(overrideLyricOverrideMusicIdAtom);
	const [
		overrideLyricOverrideOriginalLyricData,
		setOverrideLyricOverrideOriginalLyricData,
	] = useAtom(overrideLyricOverrideOriginalLyricDataAtom);
	const [
		overrideLyricOverrideTranslatedLyricData,
		setOverrideLyricOverrideTranslatedLyricData,
	] = useAtom(overrideLyricOverrideTranslatedLyricDataAtom);
	const [
		overrideLyricOverrideRomanLyricData,
		setOverrideLyricOverrideRomanLyricData,
	] = useAtom(overrideLyricOverrideRomanLyricDataAtom);
	const shouldDisable = useAtomValue(shouldDisableAtom);
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				gap: "1em",
				paddingRight: "1em",
			}}
		>
			<div
				style={{
					marginTop: "1em",
					display: "flex",
					gap: "1em",
					alignItems: "center",
				}}
			>
				<div
					style={{
						flex: "1",
					}}
				>
					<div
						style={{
							fontSize: "13px",
						}}
					>
						歌词时间位移
					</div>
					<div
						style={{
							opacity: "0.5",
						}}
					>
						单位毫秒，正值为提前，负值为推迟，留空为 0
					</div>
				</div>
				<TextField
					style={{
						width: "8em",
					}}
					value={overrideLyricOffset}
					onChange={(e) =>
						setOverrideLyricOffset(Number(e.currentTarget.value))
					}
					type="number"
				/>
			</div>
			<div
				style={{
					display: "flex",
					gap: "1em",
					alignItems: "center",
				}}
			>
				<div
					style={{
						flex: "1",
					}}
				>
					<div
						style={{
							fontSize: "13px",
						}}
					>
						歌词覆盖方式
					</div>
				</div>
				<Select
					data={[
						{
							value: LyricOverrideType.None,
							label: "不替换",
						},
						{
							value: LyricOverrideType.PureMusic,
							label: "纯音乐",
						},
						{
							value: LyricOverrideType.LocalLRC,
							label: "使用本地 LRC 歌词",
						},
						{
							value: LyricOverrideType.LocalYRC,
							label: "使用本地 YRC 歌词",
						},
						{
							value: LyricOverrideType.LocalQRC,
							label: "使用本地 QRC 歌词",
						},
						{
							value: LyricOverrideType.LocalTTML,
							label: "使用本地 TTML 歌词",
						},
					]}
					disabled={shouldDisable}
					value={overrideLyricOverrideType}
					onChange={(v) => setOverrideLyricOverrideType(v)}
				/>
			</div>
			{overrideLyricOverrideType === LyricOverrideType.MusicId && (
				<div
					style={{
						display: "flex",
						gap: "1em",
						alignItems: "center",
					}}
				>
					<div
						style={{
							flex: "1",
						}}
					>
						<div
							style={{
								fontSize: "13px",
							}}
						>
							歌曲ID
						</div>
					</div>
					<TextField
						style={{
							width: "8em",
						}}
						disabled={shouldDisable}
						value={overrideLyricOverrideMusicId}
						onChange={(e) =>
							setOverrideLyricOverrideMusicId(e.currentTarget.value)
						}
						type="text"
					/>
				</div>
			)}
			{[
				LyricOverrideType.LocalLRC,
				LyricOverrideType.LocalQRC,
				LyricOverrideType.LocalYRC,
			].includes(overrideLyricOverrideType) && (
				<>
					<div>原文歌词内容</div>
					<textarea
						className="raw-lyric-info-textarea"
						value={overrideLyricOverrideOriginalLyricData}
						disabled={shouldDisable}
						onChange={(e) =>
							setOverrideLyricOverrideOriginalLyricData(e.currentTarget.value)
						}
					/>
					<div>译文歌词内容（必须 LRC 格式）</div>
					<textarea
						className="raw-lyric-info-textarea"
						value={overrideLyricOverrideTranslatedLyricData}
						disabled={shouldDisable}
						onChange={(e) =>
							setOverrideLyricOverrideTranslatedLyricData(e.currentTarget.value)
						}
					/>
					<div>音译歌词内容（必须 LRC 格式）</div>
					<textarea
						className="raw-lyric-info-textarea"
						value={overrideLyricOverrideRomanLyricData}
						disabled={shouldDisable}
						onChange={(e) =>
							setOverrideLyricOverrideRomanLyricData(e.currentTarget.value)
						}
					/>
				</>
			)}
			{overrideLyricOverrideType === LyricOverrideType.LocalTTML && (
				<>
					<div>TTML 歌词内容</div>
					<textarea
						className="raw-lyric-info-textarea"
						value={overrideLyricOverrideOriginalLyricData}
						onChange={(e) =>
							setOverrideLyricOverrideOriginalLyricData(e.currentTarget.value)
						}
					/>
				</>
			)}
		</div>
	);
};

const MusicInit: FC = () => {
	const musicOverrideWindowOpened = useAtomValue(musicOverrideWindowOpenedAtom);
	const musicOverrideData = useAtomValue(loadableMusicOverrideDataAtom);

	const initOverrideMusicData = useAtomCallback((get, set) => {
		const musicOverrideData = get(loadableMusicOverrideDataAtom);
		if (musicOverrideWindowOpened && musicOverrideData.state === "hasData") {
			set(
				editingMusicOverrideDataAtom,
				Object.assign(newOverrideData(), musicOverrideData.data),
			);
		} else {
			set(editingMusicOverrideDataAtom, newOverrideData());
		}
	});
	useLayoutEffect(initOverrideMusicData, [
		musicOverrideWindowOpened,
		musicOverrideData.state,
	]);
	return null;
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
		const newData = newOverrideData();
		const data: Partial<MusicOverrideData> = Object.fromEntries(
			Object.entries(get(editingMusicOverrideDataAtom)).filter(
				(v) => v[1] && v[1] !== newData[v[0] as keyof MusicOverrideData],
			),
		);
		await set(musicOverrideDataAtom, data);
		set(musicOverrideSavingAtom, false);
	});

	return (
		<>
			<MusicInit />
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
		</>
	);
};

import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { Button } from "../../components/appkit/button";
import { TextField } from "../../components/appkit/text-field";
import { AppKitWindow } from "../../components/appkit/window";
import "./music-override-window.sass";
import {
	loadableMusicOverrideDataAtom,
	musicArtistsAtom,
	musicNameAtom,
	musicOverrideDataAtom,
} from "../../music-context/wrapper";
import { Alert } from "../../components/appkit/alert";
import { useLayoutEffect, useState } from "react";

export const musicOverrideWindowOpenedAtom = atom(false);

export const MusicOverrideWindow = () => {
	const musicName = useAtomValue(musicNameAtom);
	const musicArtists = useAtomValue(musicArtistsAtom);
	const [musicOverrideWindowOpened, setMusicOverrideWindowOpened] = useAtom(
		musicOverrideWindowOpenedAtom,
	);
	const musicOverrideData = useAtomValue(loadableMusicOverrideDataAtom);
	const setMusicOverrideData = useSetAtom(musicOverrideDataAtom);
	const [overrideMusicName, setOverrideMusicName] = useState("");
	const [overrideMusicArtists, setOverrideMusicArtists] = useState("");
	const [overrideMusicCoverUrl, setOverrideMusicCoverUrl] = useState("");
	const [saving, setSaving] = useState(false);
	useLayoutEffect(() => {
		if (musicOverrideWindowOpened && musicOverrideData.state === "hasData") {
			setOverrideMusicName(musicOverrideData.data.musicName || "");
			setOverrideMusicArtists(musicOverrideData.data.musicArtists || "");
			setOverrideMusicCoverUrl(musicOverrideData.data.musicCoverUrl || "");
		} else {
			setOverrideMusicName("");
			setOverrideMusicArtists("");
			setOverrideMusicCoverUrl("");
		}
	}, [musicOverrideWindowOpened, musicOverrideData.state]);
	const shouldDisable = saving || musicOverrideData.state === "loading";
	return (
		<AppKitWindow
			width={600}
			height={400}
			open={musicOverrideWindowOpened}
			onClose={() => setMusicOverrideWindowOpened(false)}
			title={`编辑音乐数据：${musicArtists
				.map((v) => v.name)
				.join(", ")} - ${musicName}`}
		>
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
							<TextField
								style={{ width: "100%", boxSizing: "border-box" }}
								label="图片链接"
								placeholder="留空以保持默认"
								value={overrideMusicCoverUrl}
								disabled={shouldDisable}
								onChange={(e) =>
									setOverrideMusicCoverUrl(e.currentTarget.value)
								}
							/>
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
						</div>
						<div>
							<div style={{ marginBlock: "0.5em" }}>专辑图片示例</div>
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
						</div>
					</div>
				</div>
				<div
					style={{
						display: "flex",
						gap: "1em",
						justifyContent: "flex-end",
					}}
				>
					<Button
						disabled={shouldDisable}
						onClick={async () => {
							setSaving(true);
							setMusicOverrideData({});
							setSaving(false);
						}}
					>
						全部还原默认
					</Button>
					<Button
						accent
						disabled={shouldDisable}
						onClick={async () => {
							setSaving(true);
							const data = {
								musicName: overrideMusicName || undefined,
								musicArtists: overrideMusicArtists || undefined,
								musicCoverUrl: overrideMusicCoverUrl || undefined,
							};
							setMusicOverrideData(data);
							setSaving(false);
						}}
					>
						保存并更新
					</Button>
				</div>
			</div>
		</AppKitWindow>
	);
};

import { atom, useAtom, useAtomValue } from "jotai";
import { Button } from "../../components/appkit/button";
import { Select } from "../../components/appkit/select";
import { TextField } from "../../components/appkit/text-field";
import { AppKitWindow } from "../../components/appkit/window";
import "./music-override-window.sass";
import { musicArtistsAtom, musicNameAtom } from "../../music-context/wrapper";
import { Alert } from "../../components/appkit/alert";

export const musicOverrideWindowOpenedAtom = atom(false);

export const MusicOverrideWindow = () => {
	const musicName = useAtomValue(musicNameAtom);
	const musicArtists = useAtomValue(musicArtistsAtom);
	const [musicOverrideWindowOpened, setMusicOverrideWindowOpened] = useAtom(
		musicOverrideWindowOpenedAtom,
	);
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
					<Alert type="warning" title="注意">
						此功能尚未完成，仅供预览 <br />
						之后歌词覆盖功能也会往这里塞的（）
					</Alert>
					<TextField
						style={{ width: "100%", boxSizing: "border-box" }}
						label="歌曲名"
						placeholder="留空以保持默认"
					/>
					<TextField
						style={{ width: "100%", boxSizing: "border-box" }}
						label="歌手名"
						placeholder="留空以保持默认"
					/>
					<div
						style={{
							display: "flex",
							gap: "1em",
						}}
					>
						<div style={{ flex: "1" }}>
							<div style={{ marginBlock: "0.5em" }}>专辑图片</div>
							<Select
								data={[
									{
										label: "使用默认",
										value: "default",
									},
									{
										label: "使用网络图片",
										value: "network",
									},
									{
										label: "使用本地图片",
										value: "local",
									},
								]}
								value={"default"}
								onChange={() => {}}
							/>
							<TextField
								style={{ width: "100%", boxSizing: "border-box" }}
								label="网络图片链接"
								placeholder="留空以保持默认"
							/>
							<Button style={{ marginBlock: "0.5em" }}>打开图片</Button>
						</div>
						<div>
							<div style={{ marginBlock: "0.5em" }}>专辑图片示例</div>
							<div
								style={{
									width: "100px",
									height: "100px",
									aspectRatio: "1/1",
									background: "white",
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
					<Button>全部还原默认</Button>
					{/* <Button accent>保存并更新</Button> */}
				</div>
			</div>
		</AppKitWindow>
	);
};

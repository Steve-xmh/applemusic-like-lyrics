import { ActionIcon } from "@mantine/core";
import { IconDots } from "@tabler/icons";
import * as React from "react";
import { useConfigBoolean } from "../api/react";
import { Menu, MenuDevider, MenuItem } from "./appkit/menu";

export const LyricPlayerTopBar: React.FC<{
	isFullScreen: boolean;
	onSetFullScreen: (shouldFullScreent: boolean) => void;
}> = (props) => {
	const [menuOpened, setMenuOpened] = React.useState(false);
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
		<div className="am-lyric-options">
			<ActionIcon
				radius="md"
				onClick={() => setMenuOpened(true)}
				variant="transparent"
			>
				<IconDots color="#FFFFFF" size={18} />
			</ActionIcon>
			<Menu
				hasCheckBoxMenuItems
				opened={menuOpened}
				onClose={() => setMenuOpened(false)}
			>
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
				<MenuItem label="调整当前歌曲歌词时序位移" />
				<MenuItem label="更换当前歌曲歌词为...">
					<MenuItem label="网易云对应音乐 ID 的音乐" />
					<MenuItem label="网络搜索歌词文件" />
					<MenuItem label="本地文件的歌词" />
					<MenuItem label="纯音乐歌词" />
				</MenuItem>
				<MenuDevider />
				<MenuItem
					label="Apple Music-like Lyric 插件设置..."
					onClick={() => {
						if (!document.querySelector(".better-ncm-manager.g-mn.ncmm-show"))
							document
								.querySelector<HTMLDivElement>("a[title=BetterNCM]")
								?.click();
						document
							.querySelector<HTMLDivElement>("[data-action=min]")
							?.click();
						document
							.querySelector<HTMLDivElement>(
								`.better-ncm-manager .loaded-plugins-list .plugin-btn[data-plugin-slug='${plugin.manifest.slug}']`,
							)
							?.click();
					}}
				/>
			</Menu>
		</div>
	);
};

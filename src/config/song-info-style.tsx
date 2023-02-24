import { Select, Title } from "@mantine/core";
import { useConfig } from "../api/react";
import {
	SwitchConfigComponent,
	TextConfigComponent,
} from "./config-components";

export const SongInfoStyleSettings: React.FC = () => {
	const [widgetUnderProgressBar, setWidgetUnderProgressBar] = useConfig(
		"widgetUnderProgressBar",
		"play-controls",
	);

	const data = [
		{
			label: "不显示",
			value: "none",
		},
		{
			label: "播放控制组件",
			value: "play-controls",
		},
	];

	if (betterncm.isMRBNCM) {
		data.push({
			label: "音频可视化 - 频谱",
			value: "audio-viz-fft",
		});
	}

	return (
		<>
			<Title order={2}>歌曲信息样式设置</Title>
			<SwitchConfigComponent
				settingKey="hideAudioQualityTag"
				label="隐藏音质标签"
			/>
			<SwitchConfigComponent settingKey="hideAlbumImage" label="隐藏专辑图" />
			<SwitchConfigComponent settingKey="hideMusicName" label="隐藏歌名" />
			<SwitchConfigComponent settingKey="hideMusicAlbum" label="隐藏专辑名" />
			<SwitchConfigComponent settingKey="hideMusicArtists" label="隐藏歌手名" />
			<SwitchConfigComponent settingKey="hideMenuButton" label="隐藏菜单按钮" />
			<SwitchConfigComponent settingKey="hidePlayProgressBar" label="隐藏播放进度条" />
			<TextConfigComponent
				label="歌手名分隔符"
				settingKey="musicArtistsSeparator"
				defaultValue={`" - "`}
			/>
			<Select
				label="进度条下方的组件"
				value={widgetUnderProgressBar}
				onChange={setWidgetUnderProgressBar}
				data={data}
			/>
		</>
	);
};

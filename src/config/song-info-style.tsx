import { Select } from "@mantine/core";
import { useConfig } from "../api/react";
import { GroupBox } from "../components/appkit/group-box";
import {
	SliderConfigComponent,
	SwitchConfigComponent,
	TextConfigComponent,
} from "./config-components";

const fftWeightingMethodData = [
	{
		label: "不使用权重算法",
		value: "",
	},
	{
		label: "A 权重算法",
		value: "aWeighting",
	},
	{
		label: "B 权重算法",
		value: "bWeighting",
	},
	{
		label: "C 权重算法",
		value: "cWeighting",
	},
	{
		label: "D 权重算法",
		value: "dWeighting",
	},
];

export const SongInfoStyleSettings: React.FC = () => {
	const [widgetUnderProgressBar, setWidgetUnderProgressBar] = useConfig(
		"widgetUnderProgressBar",
		"play-controls",
	);
	const [fftWeightingMethod, setFftWeightingMethod] = useConfig(
		"fftWeightingMethod",
		"",
	);

	const widgetUnderProgressBarData = [
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
		widgetUnderProgressBarData.push({
			label: "音频可视化 - 频谱",
			value: "audio-viz-fft",
		});
	}

	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					settingKey="hideAudioQualityTag"
					label="隐藏音质标签"
				/>
				<SwitchConfigComponent settingKey="hideAlbumImage" label="隐藏专辑图" />
				<SwitchConfigComponent settingKey="hideMusicName" label="隐藏歌名" />
				<SwitchConfigComponent settingKey="hideMusicAlbum" label="隐藏专辑名" />
				<SwitchConfigComponent
					settingKey="hideMusicArtists"
					label="隐藏歌手名"
				/>
				<SwitchConfigComponent
					settingKey="hideMenuButton"
					label="隐藏菜单按钮"
				/>
				<SwitchConfigComponent
					settingKey="hidePlayProgressBar"
					label="隐藏播放进度条"
				/>
			</GroupBox>
			<GroupBox>
				<TextConfigComponent
					label="歌手名分隔符"
					settingKey="musicArtistsSeparator"
					defaultValue={`" - "`}
				/>
			</GroupBox>
			<GroupBox>
				<Select
					label="进度条下方的组件"
					value={widgetUnderProgressBar}
					onChange={setWidgetUnderProgressBar}
					data={widgetUnderProgressBarData}
				/>
				{widgetUnderProgressBar === "audio-viz-fft" && (
					<>
						<SliderConfigComponent
							label="频谱线条数量"
							min={8}
							max={256}
							defaultValue={64}
							settingKey="fftBarAmount"
						/>
						<SliderConfigComponent
							label="频谱线条粗细半径"
							min={1}
							max={50}
							defaultValue={2}
							settingKey="fftBarThinkness"
						/>
						<SliderConfigComponent
							label="频谱线条变化级别"
							description="越大变化越慢"
							min={0}
							max={16}
							defaultValue={4}
							settingKey="fftBarTweenSoftness"
						/>
						<Select
							label="可视化频谱频率权重算法"
							value={fftWeightingMethod}
							onChange={setFftWeightingMethod}
							data={fftWeightingMethodData}
						/>
					</>
				)}
			</GroupBox>
		</>
	);
};

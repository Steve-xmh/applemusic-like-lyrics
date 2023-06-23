import { Select, SelectItem } from "@mantine/core";
import { useConfig } from "../api/react";
import { GroupBox, GroupBoxDevider } from "../components/appkit/group-box";
import { PlayControlButtonType } from "../components/song-info/play-control-button";
import {
	SliderConfigComponent,
	SwitchConfigComponent,
	TextConfigComponent,
} from "./config-components";
import { isNCMV3 } from "../utils";
import React from "react";

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
	const [leftControlBtn, setLeftControlBtn] = useConfig(
		"leftControlBtn",
		PlayControlButtonType.PlaybackRandom,
	);
	const [rightControlBtn, setRightControlBtn] = useConfig(
		"rightControlBtn",
		PlayControlButtonType.PlaybackRepeat,
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

	if (betterncm.isMRBNCM || isNCMV3()) {
		widgetUnderProgressBarData.push({
			label: "音频可视化 - 频谱",
			value: "audio-viz-fft",
		});
	}

	const controlButtonTypeData = React.useMemo(
		() =>
			[
				{
					label: "切换顺序播放播放",
					value: PlayControlButtonType.PlaybackOrder,
				},
				{
					label: "切换列表循环播放",
					value: PlayControlButtonType.PlaybackRepeat,
				},
				{
					label: "切换单曲循环播放",
					value: PlayControlButtonType.PlaybackOne,
				},
				{
					label: "切换随机播放",
					value: PlayControlButtonType.PlaybackRandom,
				},
				isNCMV3()
					? undefined
					: {
							label: "切换心动模式播放",
							value: PlayControlButtonType.PlaybackAI,
					  },
				isNCMV3()
					? undefined
					: {
							label: "收藏歌曲",
							value: PlayControlButtonType.AddToPlaylist,
					  },
				{
					label: "喜欢/取消喜欢歌曲（星型样式）",
					value: PlayControlButtonType.AddToFav,
				},
				{
					label: "喜欢/取消喜欢歌曲（心型样式）",
					value: PlayControlButtonType.AddToFavHeart,
				},
				{
					label: "切换播放模式",
					value: PlayControlButtonType.PlaybackSwitcher,
				},
				{
					label: "切换播放模式（填充样式）",
					value: PlayControlButtonType.PlaybackSwitcherFilled,
				},
			].filter((v) => !!v) as SelectItem[],
		[],
	);

	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					settingKey="hideAudioQualityTag"
					label="隐藏音质标签"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent settingKey="hideAlbumImage" label="隐藏专辑图" />
				<GroupBoxDevider />
				<SwitchConfigComponent settingKey="hideMusicName" label="隐藏歌名" />
				<GroupBoxDevider />
				<SwitchConfigComponent
					settingKey="hideMusicAlbum"
					label="隐藏专辑名"
					defaultValue={true}
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					settingKey="hideMusicArtists"
					label="隐藏歌手名"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					settingKey="hideMenuButton"
					label="隐藏菜单按钮"
					description="隐藏后，你依然可以通过右键左侧任意位置打开菜单"
				/>
				<GroupBoxDevider />
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
				{widgetUnderProgressBar === "play-controls" && (
					<>
						<GroupBoxDevider />
						<Select
							label="左侧控制按钮功能"
							value={leftControlBtn}
							onChange={setLeftControlBtn}
							data={controlButtonTypeData}
						/>
						<GroupBoxDevider />
						<Select
							label="右侧控制按钮功能"
							value={rightControlBtn}
							onChange={setRightControlBtn}
							data={controlButtonTypeData}
						/>
					</>
				)}
				{widgetUnderProgressBar === "audio-viz-fft" && (
					<>
						<GroupBoxDevider />
						<SliderConfigComponent
							label="频谱线条数量"
							min={8}
							max={256}
							defaultValue={64}
							settingKey="fftBarAmount"
						/>
						<GroupBoxDevider />
						<SliderConfigComponent
							label="频谱线条粗细半径"
							min={1}
							max={50}
							defaultValue={2}
							settingKey="fftBarThinkness"
						/>
						<GroupBoxDevider />
						<SliderConfigComponent
							label="频谱线条变化级别"
							description="越大变化越慢"
							min={0}
							max={16}
							defaultValue={4}
							settingKey="fftBarTweenSoftness"
						/>
						<GroupBoxDevider />
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

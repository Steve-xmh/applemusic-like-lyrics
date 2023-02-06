import {
	Button,
	Title,
	Space,
	Text,
	Select,
	SelectItem,
	ThemeIcon,
	Group,
} from "@mantine/core";
import {
	SliderConfigComponent,
	SwitchConfigComponent,
} from "./config-components";
import { useConfig, useConfigValueBoolean } from "../api/react";
import { FBMWaveMethod } from "../components/lyric-background/fbm-wave";
import { IconDisc, IconRipple } from "@tabler/icons";
import { BlurAlbumMethod } from "../components/lyric-background/blur-album";
import { BackgroundRenderMethod } from "../components/lyric-background/render";
import * as React from "react";

type BGRendererMethodData = BackgroundRenderMethod &
	SelectItem & {
		icon: () => JSX.Element;
	};

const BG_RENDERER_METHOD_DATA: BGRendererMethodData[] = [
	{
		icon: () => <IconDisc />,
		...BlurAlbumMethod,
	},
	{
		icon: () => <IconRipple />,
		...FBMWaveMethod,
	},
];

const BGRendererMethodItem = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div"> & BGRendererMethodData
>(({ label, icon, description, ...others }, ref) => (
	<div ref={ref} {...others}>
		<Group noWrap>
			<ThemeIcon size="xl">{icon()}</ThemeIcon>

			<div>
				<Text size="sm">{label}</Text>
				<Text size="xs" opacity={0.65}>
					{description}
				</Text>
			</div>
		</Group>
	</div>
));

export const OtherStyleSettings: React.FC = () => {
	const showBackground = useConfigValueBoolean("showBackground", true);
	const [bgRenderMethod, setBGRenderMethod] = useConfig(
		"backgroundRenderMethod",
		BlurAlbumMethod.value,
	);

	return (
		<>
			<Title order={2}>其它样式设置</Title>
			<SwitchConfigComponent
				settingKey="autoHideControlBar"
				label="鼠标静止时自动隐藏播放栏和标题栏"
			/>
			<SliderConfigComponent
				step={0.5}
				min={1}
				max={30}
				formatLabel={(v: number) => `${v} 秒`}
				settingKey="autoHideDuration"
				label="鼠标静止隐藏间隔（秒）"
			/>
			<SwitchConfigComponent
				settingKey="usePingFangFont"
				label="播放页面使用苹方字体（需要系统安装）"
			/>
			<Button
				sx={{ margin: "8px 0" }}
				variant="outline"
				onClick={() => {
					betterncm.ncm.openUrl(
						"https://ghproxy.com/https://github.com/paraself/PingFang-Fonts/archive/refs/heads/master.zip",
					);
				}}
			>
				你可以在此下载安装苹方字体
			</Button>
			<Space h="xl" />
			<SwitchConfigComponent
				settingKey="showBackground"
				label="显示背景"
				defaultValue={true}
			/>
			<Select
				label="歌词渲染方式"
				itemComponent={BGRendererMethodItem}
				data={BG_RENDERER_METHOD_DATA}
				onChange={setBGRenderMethod}
				value={bgRenderMethod}
			/>
			<SliderConfigComponent
				step={0.05}
				min={0.05}
				max={2}
				defaultValue={1}
				disabled={!showBackground}
				formatLabel={(v: number) => v.toFixed(1)}
				settingKey="backgroundRenderScale"
				label="背景渲染分辨率比率"
			/>
			<SliderConfigComponent
				step={1}
				min={0}
				max={60}
				defaultValue={0}
				disabled={!showBackground}
				formatLabel={(v: number) => (v === 0 ? "不跳帧" : `跳过 ${v} 帧`)}
				settingKey="backgroundRenderSkipFrames"
				label="背景渲染跳帧"
			/>
			<SliderConfigComponent
				settingKey="backgroundLightness"
				label="背景专辑图采样色亮度"
				disabled={!showBackground}
				min={0}
				max={2}
				step={0.01}
				defaultValue={1}
				formatLabel={(v: number) => {
					if (v === 1) {
						return "不调整";
					} else if (v < 1) {
						if (v <= 0) {
							return "全黑";
						} else {
							return `调暗 ${Math.round(100 - v * 100)}%`;
						}
					} else {
						if (v >= 2) {
							return "全白";
						} else {
							return `调亮 ${Math.round(v * 100 - 100)}%`;
						}
					}
				}}
			/>
		</>
	);
};

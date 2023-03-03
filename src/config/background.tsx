import { Text, Select, SelectItem, ThemeIcon, Group } from "@mantine/core";
import {
	SliderConfigComponent,
	SwitchConfigComponent,
} from "./config-components";
import { useConfig, useConfigValueBoolean } from "../api/react";
import { FBMWaveMethod } from "../components/lyric-background/fbm-wave";
import { IconDisc, IconMountain, IconRipple } from "@tabler/icons";
import { BlurAlbumMethod } from "../components/lyric-background/blur-album";
import { BackgroundRenderMethod } from "../components/lyric-background/render";
import * as React from "react";
import { MontereyWannaBe } from "../components/lyric-background/monterey-wannabe";
import { GroupBox } from "../components/appkit/group-box";

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
	{
		icon: () => <IconMountain />,
		...MontereyWannaBe,
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

export const BackgroundSettings: React.FC = () => {
	const showBackground = useConfigValueBoolean("showBackground", true);
	const [bgRenderMethod, setBGRenderMethod] = useConfig(
		"backgroundRenderMethod",
		BlurAlbumMethod.value,
	);

	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					settingKey="showBackground"
					label="显示背景"
					defaultValue={true}
				/>
			</GroupBox>
			{showBackground && (
				<>
					<GroupBox>
						<Select
							label="背景渲染方式"
							itemComponent={BGRendererMethodItem}
							data={BG_RENDERER_METHOD_DATA}
							onChange={setBGRenderMethod}
							value={bgRenderMethod}
						/>
					</GroupBox>
					<GroupBox>
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
					</GroupBox>
				</>
			)}
		</>
	);
};

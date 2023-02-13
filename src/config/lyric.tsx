import { Group, Select, Text, ThemeIcon, Title } from "@mantine/core";
import { IconArtboard, IconBrandReactNative } from "@tabler/icons";
import * as React from "react";
import { useConfig } from "../api/react";
import { RendererBackend } from "../components/lyric-renderer";
import {
	SliderConfigComponent,
	SwitchConfigComponent,
} from "./config-components";

interface RendererMethodData {
	icon: () => JSX.Element;
	value: RendererBackend;
	label: string;
	desc: string;
}

const RENDERER_METHOD_DATA: RendererMethodData[] = [
	{
		icon: () => <IconBrandReactNative />,
		value: RendererBackend.DOM,
		label: "DOM",
		desc: "传统的 DOM 元素渲染方式",
	},
	{
		icon: () => <IconArtboard />,
		value: RendererBackend.Canvas,
		label: "Canvas（开发中）",
		desc: "未来的画板绘制方式，将会比 DOM 更加流畅且拥有更多效果（目前还在开发中，功能非常有限且有很多问题）",
	},
];

const RendererMethodItem = React.forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef<"div"> & RendererMethodData
>(({ label, icon, value: _value, desc, ...others }, ref) => (
	<div ref={ref} {...others}>
		<Group noWrap>
			<ThemeIcon size="xl">{icon()}</ThemeIcon>

			<div>
				<Text size="sm">{label}</Text>
				<Text size="xs" opacity={0.65}>
					{desc}
				</Text>
			</div>
		</Group>
	</div>
));

export const LyricSettings: React.FC = () => {
	const [rendererBackend, setRendererBackend] = useConfig(
		"rendererBackend",
		RendererBackend.DOM,
	);
	return (
		<>
			<Title order={2}>歌词设置</Title>
			<Select
				label="歌词渲染方式"
				itemComponent={RendererMethodItem}
				data={RENDERER_METHOD_DATA}
				onChange={setRendererBackend}
				value={rendererBackend}
			/>
			<SwitchConfigComponent
				settingKey="translated-lyric"
				label="显示翻译歌词"
				defaultValue={false}
			/>
			<SwitchConfigComponent
				settingKey="roman-lyric"
				label="显示音译歌词"
				defaultValue={false}
			/>
			<SwitchConfigComponent
				settingKey="dynamic-lyric"
				label="显示逐词歌词（实验性）"
				defaultValue={false}
			/>
			<SwitchConfigComponent
				settingKey="mergeOriginalOnlyLine"
				label="合并没有译文的歌词"
				defaultValue={false}
			/>
			<SliderConfigComponent
				settingKey="globalTimeStampOffset"
				label="全局歌词时序偏移（秒）"
				formatLabel={(v: number) => {
					if (v === 0) {
						return "不调整";
					} else if (v < 0) {
						return `推迟 ${(-v).toFixed(1)} 秒`;
					} else {
						return `提前 ${v.toFixed(1)} 秒`;
					}
				}}
				min={-10}
				step={0.1}
				defaultValue={0}
				max={10}
			/>
			<SwitchConfigComponent
				settingKey="enableEditor"
				label="启用歌词编辑器连接（请勿开启）"
				defaultValue={false}
			/>
		</>
	);
};

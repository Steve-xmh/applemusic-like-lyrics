import { Title } from "@mantine/core";
import { useConfig } from "../api";
import {
	ColorConfigComponent,
	SliderConfigComponent,
	SwitchConfigComponent,
} from "./config-components";

export const LyricStyleSettings: React.FC = () => {
	const [lyricAutoFontSize] = useConfig("lyricAutoFontSize", "false");
	return (
		<>
			<Title order={2}>歌词样式设置</Title>
			<SwitchConfigComponent
				settingKey="lyricBlurEffect"
				label="歌词模糊效果"
			/>
			<SwitchConfigComponent
				settingKey="lyricScaleEffect"
				label="歌词缩放效果"
			/>
			<SwitchConfigComponent
				settingKey="lyricHidePassed"
				label="已播放歌词隐藏效果"
			/>
			<SwitchConfigComponent
				settingKey="lyricBlurFadeInEffect"
				label="未播放歌词淡入效果"
			/>
			<ColorConfigComponent
				label="字体颜色"
				settingKey="fontColor"
				defaultValue="#FFFFFFFF"
			/>
			<SwitchConfigComponent
				settingKey="lyricAutoFontSize"
				defaultValue={true}
				label="自适应歌词字体大小（关闭以自定义歌词字体大小）"
			/>
			<SliderConfigComponent
				step={1}
				min={8}
				max={64}
				defaultValue={16}
				disabled={lyricAutoFontSize === "true"}
				settingKey="lyricFontSize"
				formatLabel={(v: number) => `${v}px`}
				label="歌词字体大小（像素）"
			/>
		</>
	);
};

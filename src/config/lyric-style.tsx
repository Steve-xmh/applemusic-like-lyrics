import { useConfigValueBoolean } from "../api/react";
import {
	ColorConfigComponent,
	SliderConfigComponent,
	SwitchConfigComponent,
} from "./config-components";

export const LyricStyleSettings: React.FC = () => {
	const lyricFixedFontSize = useConfigValueBoolean("lyricFixedFontSize", false);
	const fontShadow = useConfigValueBoolean("fontShadow");
	return (
		<>
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
			<SwitchConfigComponent
				settingKey="fontShadow"
				label="文字阴影"
				defaultValue={false}
			/>
			<SliderConfigComponent
				settingKey="fontShadowSize"
				label="文字阴影大小"
				disabled={!fontShadow}
				formatLabel={(v: number) => `${v}px`}
				min={0}
				step={1}
				defaultValue={0}
				max={100}
			/>
			<SwitchConfigComponent
				settingKey="alignTopSelectedLyric"
				label="歌词滚动位置向上对齐"
			/>
			<ColorConfigComponent
				label="字体颜色"
				settingKey="fontColor"
				defaultValue="#FFFFFFFF"
			/>
			<SwitchConfigComponent
				settingKey="lyricFixedFontSize"
				defaultValue={lyricFixedFontSize}
				label="自定义字体大小（关闭以使用自适应字体大小）"
			/>
			<SliderConfigComponent
				step={1}
				min={8}
				max={64}
				defaultValue={16}
				disabled={!lyricFixedFontSize}
				settingKey="lyricFontSize"
				formatLabel={(v: number) => `${v}px`}
				label="歌词字体大小（像素）"
			/>
		</>
	);
};

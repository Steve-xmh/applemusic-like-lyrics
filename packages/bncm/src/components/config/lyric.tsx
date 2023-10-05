import { FC } from "react";
import { GroupBox, GroupBoxDevider } from "../appkit/group-box";
import { ColorConfigComponent, SwitchConfigComponent } from "./common";
import {
	showTranslatedLineAtom,
	showRomanLineAtom,
	swapTranslatedRomanLineAtom,
	lyricBlurEffectAtom,
	lyricScaleEffectAtom,
	lyricHidePassedAtom,
	fontColorAtom,
	lyricSpringEffectAtom,
} from "./atoms";

export const LyricConfig: FC = () => {
	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					atom={showTranslatedLineAtom}
					label="显示翻译歌词"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent atom={showRomanLineAtom} label="显示翻译歌词" />
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={swapTranslatedRomanLineAtom}
					label="交换翻译和音译歌词顺序"
				/>
			</GroupBox>
			<GroupBox>
				<SwitchConfigComponent
					atom={lyricBlurEffectAtom}
					description="如果歌词页面播放流畅度不佳的话，可以尝试禁用这个模糊效果"
					label="歌词模糊效果"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={lyricScaleEffectAtom}
					description="本选项对性能的影响微乎其微，可按个人喜好设置"
					label="歌词缩放效果"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={lyricSpringEffectAtom}
					description="如果启用，则会通过弹簧算法实时处理歌词位置，但是需要性能较好的电脑方可流畅运行&#10;如果不启用，则会回退到基于 `transition` 的过渡效果，对低性能的机器比较友好，但是效果会比较单一"
					label="歌词行物理弹簧动画效果"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={lyricHidePassedAtom}
					label="已播放歌词隐藏效果"
				/>
			</GroupBox>
			<GroupBox>
				<ColorConfigComponent atom={fontColorAtom} label="字体颜色" />
			</GroupBox>
		</>
	);
};

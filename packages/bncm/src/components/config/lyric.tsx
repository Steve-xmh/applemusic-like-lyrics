import { FC } from "react";
import { GroupBox, GroupBoxDevider } from "../appkit/group-box";
import { SwitchConfigComponent } from "./common";
import { showTranslatedLineAtom, showRomanLineAtom, swapTranslatedRomanLineAtom, lyricBlurEffectAtom, lyricScaleEffectAtom, lyricHidePassedAtom } from "./atoms";

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
					label="歌词模糊效果"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={lyricScaleEffectAtom}
					label="歌词缩放效果"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={lyricHidePassedAtom}
					label="已播放歌词隐藏效果"
				/>
			</GroupBox>
		</>
	);
};

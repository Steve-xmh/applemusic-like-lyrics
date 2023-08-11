import { FC } from "react";
import { GroupBox, GroupBoxDevider } from "../appkit/group-box";
import { Switch } from "../appkit/switch/switch";
import { TextField } from "../appkit/text-field";
import { Button } from "../appkit/button";
import { useAtom, useAtomValue } from "jotai";
import { wsConnectionStatusAtom } from "../../music-context/ws-wrapper";
import { Spinner } from "../appkit/spinner/spinner";
import { atomWithConfig } from "./atom-with-config";
import { SwitchConfigComponent } from "./common";

export const showTranslatedLineAtom = atomWithConfig({
	key: "show-translated-line",
	default: true,
	desc: "是否显示翻译歌词行",
});
export const showRomanLineAtom = atomWithConfig({
	key: "show-roman-line",
	default: true,
	desc: "是否显示音译歌词行",
});

export const swapTranslatedRomanLineAtom = atomWithConfig({
	key: "swap-trans-roman-line",
	default: false,
	desc: "是否交换翻译行和音译行的位置",
});

export const lyricBlurEffectAtom = atomWithConfig({
	key: "lyric-blur-effect",
	default: true,
	desc: "是否应用歌词行的模糊效果",
});
export const lyricScaleEffectAtom = atomWithConfig({
	key: "lyric-scale-effect",
	default: true,
	desc: "是否应用歌词行的缩放效果",
});

export const lyricHidePassedAtom = atomWithConfig({
	key: "lyric-hide-passed",
	default: false,
	desc: "是否隐藏当前进度之后播放完成的歌词行，而不是降低不透明度",
});

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

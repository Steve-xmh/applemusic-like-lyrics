import { FC } from "react";
import { GroupBox, GroupBoxDevider } from "../appkit/group-box";
import { SwitchConfigComponent, SwitchLoadableConfigComponent } from "./common";
import {
	autoOpenLyricPageAtom,
	disableMixBlendModeAtom,
	hideCursorWhenHoveringCoverAtom,
	keepBuiltinPlayerWhenConnectedAtom,
	pauseWhenMusicLoadedAtom,
	showBackgroundFFTLowFreqAtom,
	showStatsAtom,
	showTutoialAtom,
	usePlayPositionLerpAtom,
	forceHasLyricsBackgroundAtom,
} from "./atoms";

export const OtherConfig: FC = () => {
	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					atom={showStatsAtom}
					label="显示实时帧数统计数据"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={showBackgroundFFTLowFreqAtom}
					label="显示实时背景音频状态数据"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={forceHasLyricsBackgroundAtom}
					label="强制进入有歌词样式背景"
				/>
			</GroupBox>
			<GroupBox>
				<SwitchLoadableConfigComponent
					atom={showTutoialAtom}
					label="下一次启动时显示使用教程"
					description="如果忘记怎么操作了的话就打开这个吧"
				/>
				<GroupBoxDevider />
				<SwitchLoadableConfigComponent
					atom={autoOpenLyricPageAtom}
					label="启动时自动开启歌词页面"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={hideCursorWhenHoveringCoverAtom}
					label="当光标悬浮在封面上时隐藏指针"
					description="虽然有点奇奇怪怪"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={pauseWhenMusicLoadedAtom}
					label="音乐载入后暂停播放"
					description="当播放上下文接收到音乐加载的事件后立刻暂停播放，方便等待歌词、专辑图等资源加载完毕，也方便录制展示视频"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={keepBuiltinPlayerWhenConnectedAtom}
					label="歌词播放器连接时保持启用内嵌歌词页面"
					description="仅供性能对照使用，插件与播放器同时启用页面的话将会导致性能大幅下降"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={usePlayPositionLerpAtom}
					label="使用插值平滑播放进度"
					description="会略微提高播放进度的精度，理论上可以让AMLL更精确地判定歌词行进度和展示方式，对于某些歌曲歌词可能会有帮助。此选项在 macOS 上会无视设置强制启用。"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={disableMixBlendModeAtom}
					label="禁用高亮混色效果"
					description="对低 DPI 屏幕友好，但是会导致高亮效果变得不太明显，在不支持混色效果的浏览器上没有作用"
				/>
			</GroupBox>
		</>
	);
};

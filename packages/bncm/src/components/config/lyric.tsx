import { FC } from "react";
import { GroupBox, GroupBoxDevider } from "../appkit/group-box";
import {
	ColorConfigComponent,
	NumberTextFieldConfigComponent,
	SwitchConfigComponent,
} from "./common";
import {
	showTranslatedLineAtom,
	showRomanLineAtom,
	swapTranslatedRomanLineAtom,
	lyricBlurEffectAtom,
	lyricScaleEffectAtom,
	lyricHidePassedAtom,
	fontColorAtom,
	lyricSpringEffectAtom,
	primaryColorAtom,
	playPositionOffsetAtom,
	lyricAdvanceDynamicLyricTimeAtom,
	lyricWordFadeWidthAtom,
} from "./atoms";
import { TextField } from "../appkit/text-field";
import { useAtom } from "jotai";

export const LyricConfig: FC = () => {
	const [playPositionOffset, setPlayPositionOffset] = useAtom(
		playPositionOffsetAtom,
	);
	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					atom={showTranslatedLineAtom}
					label="显示翻译歌词"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent atom={showRomanLineAtom} label="显示音译歌词" />
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={swapTranslatedRomanLineAtom}
					label="交换翻译和音译歌词顺序"
				/>
			</GroupBox>
			<GroupBox>
				<div
					style={{
						display: "flex",
						gap: "1em",
						alignItems: "center",
					}}
				>
					<div
						style={{
							flex: "1",
						}}
					>
						<div
							style={{
								fontSize: "13px",
							}}
						>
							歌词时间位移
						</div>
						<div
							style={{
								opacity: "0.5",
							}}
						>
							单位毫秒，正值为提前，负值为推迟，留空为 0
						</div>
					</div>
					<TextField
						style={{
							width: "8em",
						}}
						value={
							playPositionOffset.state === "hasData"
								? playPositionOffset.data
								: 0
						}
						onChange={(e) =>
							setPlayPositionOffset(Number(e.currentTarget.value))
						}
						type="number"
					/>
				</div>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={lyricAdvanceDynamicLyricTimeAtom}
					description="即将原歌词行的初始时间时序提前，以便在歌词滚动结束后刚好开始播放（逐词）歌词效果。这个行为更加接近 Apple Music 的效果，但是大部分情况下会导致歌词行末尾的歌词尚未播放完成便被切换到下一行。"
					label="提前歌词行时序"
				/>
				<GroupBoxDevider />
				<NumberTextFieldConfigComponent
					atom={lyricWordFadeWidthAtom}
					description={
						"单位以歌词行的主文字字体大小的倍数为单位，默认为 0.5，即一个全角字符的一半宽度\n如果要模拟 Apple Music for Android 的效果，可以设置为 1\n如果要模拟 Apple Music for iPad 的效果，可以设置为 0.5"
					}
					label="渐变宽度"
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
				<ColorConfigComponent atom={primaryColorAtom} label="控件主要颜色" />
			</GroupBox>
		</>
	);
};

import type { FC } from "react";
import { GroupBox, GroupBoxDevider } from "../appkit/group-box";
import { SwitchConfigComponent } from "./common";
import {
	showAudioQualityTagAtom,
	showAlbumImageAtom,
	showMusicNameAtom,
	showAlbumNameAtom,
	showMusicArtistsAtom,
	showMenuButtonAtom,
	showControlThumbAtom,
	musicControlTypeAtom,
	MusicControlType,
} from "./atoms";
import { Select } from "../appkit/select";
import { useAtom } from "jotai";
import { Alert } from "../appkit/alert";

export const LyricStyleConfig: FC = () => {
	const [musicControlType, setMusicControlType] = useAtom(musicControlTypeAtom);
	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					atom={showAudioQualityTagAtom}
					label="显示音质标签"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent atom={showAlbumImageAtom} label="显示专辑图片" />
				<GroupBoxDevider />
				<SwitchConfigComponent atom={showMusicNameAtom} label="显示音乐名称" />
				<GroupBoxDevider />
				<SwitchConfigComponent atom={showAlbumNameAtom} label="显示专辑名称" />
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={showMusicArtistsAtom}
					label="显示歌手名称"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={showMenuButtonAtom}
					label="显示菜单按钮"
					description="隐藏后，你依然可以通过右键左侧任意位置打开菜单"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={showControlThumbAtom}
					label="显示控制横条"
					description="隐藏后，你依然可以通过菜单来关闭歌词页面"
				/>
			</GroupBox>
			<GroupBox>
				<div
					style={{
						display: "flex",
						gap: "8px",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<div>音乐控制组件类型</div>
					<Select
						onChange={(value) => setMusicControlType(value)}
						value={musicControlType}
						data={[
							{
								label: "无",
								value: MusicControlType.None,
							},
							{
								label: "默认",
								value: MusicControlType.Default,
							},
							{
								label: "线条音频可视化",
								value: MusicControlType.BarVisualizer,
							},
						]}
					/>
				</div>
			</GroupBox>
			{musicControlType === MusicControlType.BarVisualizer && (
				<Alert type="warning" title="音频可视化兼容性警告">
					音频可视化目前暂时仅支持网易云 3.0.0
					以上版本，其它不兼容平台将会隐藏或无动画，日后会提供兼容。
				</Alert>
			)}
		</>
	);
};

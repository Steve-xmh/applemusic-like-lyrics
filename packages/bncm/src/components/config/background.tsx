import type { FC } from "react";
import { GroupBox, GroupBoxDevider } from "../appkit/group-box";
import { SwitchConfigComponent } from "./common";
import {
	backgroundFakeLiquidStaticModeAtom,
	enableBackgroundAtom,
} from "./atoms";
import { Select } from "../appkit/select";

export const BackgroundConfig: FC = () => {
	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					atom={enableBackgroundAtom}
					label="显示歌词背景"
				/>
			</GroupBox>
			<GroupBox>
				<SwitchConfigComponent
					atom={backgroundFakeLiquidStaticModeAtom}
					label="静态模式"
					description="即背景变换完成后保持静止并暂停渲染，以改善性能"
				/>
			</GroupBox>
		</>
	);
};

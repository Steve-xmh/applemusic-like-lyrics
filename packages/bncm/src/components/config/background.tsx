import type { FC } from "react";
import { GroupBox, GroupBoxDevider } from "../appkit/group-box";
import { SwitchConfigComponent } from "./common";
import { enableBackgroundAtom } from "./atoms";
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
			<GroupBox></GroupBox>
		</>
	);
};

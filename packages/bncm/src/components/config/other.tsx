import { FC } from "react";
import { GroupBox } from "../appkit/group-box";
import { SwitchConfigComponent, SwitchLoadableConfigComponent } from "./common";
import { showStatsAtom, showTutoialAtom } from "./atoms";
import { Alert } from "../appkit/alert";

export const OtherConfig: FC = () => {
	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					atom={showStatsAtom}
					label="显示实时帧数统计数据"
				/>
			</GroupBox>
			<GroupBox>
				<SwitchLoadableConfigComponent
					atom={showTutoialAtom}
					label="下一次启动时显示使用教程"
					description="如果忘记怎么操作了的话就打开这个吧"
				/>
			</GroupBox>
		</>
	);
};

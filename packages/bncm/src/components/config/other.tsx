import { FC } from "react";
import { GroupBox } from "../appkit/group-box";
import { SwitchConfigComponent } from "./common";
import { neverGonnaGiveYouUpAtom, showTutoialAtom } from "./atoms";

export const OtherConfig: FC = () => {
	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					atom={showTutoialAtom}
					label="下一次启动时显示使用教程"
					description="如果忘记怎么操作了的话就打开这个吧"
				/>
			</GroupBox>
			<GroupBox className="amll-mouse-hover-show">
				<SwitchConfigComponent
					atom={neverGonnaGiveYouUpAtom}
					label="不再显示开发警告"
					description="俺知道有人还是想无视警告，那就随便他们吧"
				/>
			</GroupBox>
		</>
	);
};

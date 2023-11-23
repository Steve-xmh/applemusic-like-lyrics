import type { FC } from "react";
import { GroupBox, GroupBoxDevider } from "../appkit/group-box";
import { ColorConfigComponent, SwitchConfigComponent } from "./common";
import {
	BackgroundType,
	backgroundCustomSolidColorAtom,
	backgroundFakeLiquidStaticModeAtom,
	backgroundTypeAtom,
	enableBackgroundAtom,
} from "./atoms";
import { Select } from "../appkit/select";
import { useAtom, useAtomValue } from "jotai";

export const BackgroundConfig: FC = () => {
	const enableBackground = useAtomValue(enableBackgroundAtom);
	const [backgroundType, setBackgroundType] = useAtom(backgroundTypeAtom);
	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					atom={enableBackgroundAtom}
					label="显示歌词背景"
				/>
				{enableBackground && (
					<>
						<GroupBoxDevider />
						<div
							style={{
								display: "flex",
								gap: "8px",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<div className="amll-config-text">背景类型</div>
							<Select
								onChange={(value) => setBackgroundType(value)}
								value={backgroundType}
								data={[
									{
										value: BackgroundType.FakeLiquid,
										label: "伪流体背景",
									},
									{
										value: BackgroundType.CustomSolidColor,
										label: "纯实心静态颜色背景",
									},
								]}
							/>
						</div>
					</>
				)}
			</GroupBox>
			{enableBackground && (
				<>
					{backgroundType === BackgroundType.FakeLiquid && (
						<GroupBox>
							<SwitchConfigComponent
								atom={backgroundFakeLiquidStaticModeAtom}
								label="静态模式"
								description="即背景变换完成后保持静止并暂停渲染，以改善性能"
							/>
						</GroupBox>
					)}
					{backgroundType === BackgroundType.CustomSolidColor && (
						<GroupBox>
							<ColorConfigComponent
								atom={backgroundCustomSolidColorAtom}
								label="背景填充颜色"
							/>
						</GroupBox>
					)}
				</>
			)}
		</>
	);
};

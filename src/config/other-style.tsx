import { Button, Title } from "@mantine/core";
import {
	SliderConfigComponent,
	SwitchConfigComponent,
} from "./config-components";

export const OtherStyleSettings: React.FC = () => {
	return (
		<>
			<Title order={2}>其它样式设置</Title>
			<SwitchConfigComponent
				settingKey="autoHideControlBar"
				label="鼠标静止时自动隐藏播放栏和标题栏"
			/>
			<SliderConfigComponent
				step={0.5}
				min={1}
				max={30}
				formatLabel={(v: number) => `${v} 秒`}
				settingKey="autoHideDuration"
				label="鼠标静止隐藏间隔（秒）"
			/>
			<SwitchConfigComponent
				settingKey="usePingFangFont"
				label="播放页面使用苹方字体（需要系统安装）"
			/>
			<Button
				sx={{ margin: "8px 0" }}
				variant="outline"
				onClick={() => {
					betterncm.ncm.openUrl(
						"https://ghproxy.com/https://github.com/paraself/PingFang-Fonts/archive/refs/heads/master.zip",
					);
				}}
			>
				你可以在此下载安装苹方字体
			</Button>
		</>
	);
};

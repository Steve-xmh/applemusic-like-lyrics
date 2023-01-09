import { Button, Title, Space, Text, ScrollArea } from "@mantine/core";
import Editor from "react-simple-code-editor";
import {
	SliderConfigComponent,
	SwitchConfigComponent,
} from "./config-components";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-regex";
import "prismjs/components/prism-javascript";
import { useConfig } from "../react-api";

export const OtherStyleSettings: React.FC = () => {
	const [customBackgroundRenderFunc, setCustomBackgroundRenderFunc] = useConfig(
		"customBackgroundRenderFunc",
		"",
	);

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
			<Space h="xl" />
			<SwitchConfigComponent
				settingKey="showBackground"
				label="显示背景"
				defaultValue={true}
			/>
			<Space h="xl" />
			<Text fz="md">自定义背景绘制函数</Text>
			<Space h="md" />
			<Text fz="md">
				如果觉得默认背景不好看，可以尝试自己实现一个绘制方式。
			</Text>
			<Space h="md" />
			<Text fz="md">具体如何编写可以参考本插件的源代码（关于页面有）。</Text>
			<Space h="md" />
			<Text fz="md">留空则使用默认绘制方式。</Text>
			<ScrollArea
				type="auto"
				offsetScrollbars
				style={{
					background: "#0d1117",
					border: "solid 1px #30363d",
					maxHeight: "512px",
					borderRadius: "4px",
					fontFamily:
						'"Fira Code Regular", "Microsoft Yahei Mono", Consolas, "Courier New", "PingFang SC", monospace',
					fontSize: 14,
				}}
			>
				<Editor
					value={customBackgroundRenderFunc}
					onValueChange={(code) => setCustomBackgroundRenderFunc(code)}
					highlight={(code) => highlight(code, languages.javascript)}
					textareaClassName="mantine-Textarea-input"
					padding={8}
				/>
			</ScrollArea>
		</>
	);
};

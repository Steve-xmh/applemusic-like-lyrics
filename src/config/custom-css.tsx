import { Title, Text, Space, ScrollArea } from "@mantine/core";
import Editor from "react-simple-code-editor";
import { useConfig } from "../react-api";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-css";

export const CustomCSSSettings: React.FC = () => {
	const [customCSSContent, setCustomCSSContent] = useConfig(
		"customCssContent",
		"",
	);

	return (
		<>
			<Title order={2}>自定义 CSS 设置</Title>
			<Space h="xl" />
			<Text fz="md">
				如果默认的预设不适合你，那么你可以在此处自定义 CSS 样式。
			</Text>
			<Space h="md" />
			<Text fz="md">
				具体如何修改可以参考本插件的源代码（关于页面有）或 DevTools 内查看元素。
			</Text>
			<Text fz="md">自定义 CSS 样式</Text>
			<Space h="md" />
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
					value={customCSSContent}
					onValueChange={(code) => setCustomCSSContent(code)}
					highlight={(code) => highlight(code, languages.css)}
					textareaClassName="mantine-Textarea-input"
					padding={8}
				/>
			</ScrollArea>
		</>
	);
};

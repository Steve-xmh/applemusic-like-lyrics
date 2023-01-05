import { Title } from "@mantine/core";
import { SwitchConfigComponent } from "./config-components";

export const LyricSettings: React.FC = () => {
	return (
		<>
			<Title order={2}>歌词设置</Title>
			<SwitchConfigComponent
				settingKey="translated-lyric"
				label="显示翻译歌词"
				defaultValue={false}
			/>
			<SwitchConfigComponent
				settingKey="roman-lyric"
				label="显示音译歌词"
				defaultValue={false}
			/>
			<SwitchConfigComponent
				settingKey="dynamic-lyric"
				label="显示逐词歌词（实验性）"
				defaultValue={false}
			/>
		</>
	);
};

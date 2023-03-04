import * as React from "react";
import { GroupBox, GroupBoxDevider } from "../components/appkit/group-box";
import {
	SliderConfigComponent,
	SwitchConfigComponent,
} from "./config-components";

export const LyricSettings: React.FC = () => {
	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					settingKey="translated-lyric"
					label="显示翻译歌词"
					defaultValue={false}
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					settingKey="roman-lyric"
					label="显示音译歌词"
					defaultValue={false}
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					settingKey="dynamic-lyric"
					label="显示逐词歌词"
					defaultValue={false}
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					settingKey="ttml-lyric"
					label="可用时使用 TTML 歌词（实验性）"
					description="TTML 歌词即 Apple Music 所使用的逐词歌词格式，可以提供更加精确的歌词和歌词效果，将 .ttml 格式的歌词文件以网易云音乐 ID 命名后放入 betterncm/amll-data/ttml-lyrics 后即可读取。"
					defaultValue={false}
				/>
			</GroupBox>
			<GroupBox>
				<SwitchConfigComponent
					settingKey="mergeOriginalOnlyLine"
					label="合并没有译文的歌词"
					defaultValue={false}
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					settingKey="disableLyricBuffer"
					label="禁用歌词缓冲"
					description="即所选歌词将会立即滚动"
					defaultValue={false}
				/>
				<GroupBoxDevider />
				<SliderConfigComponent
					settingKey="globalTimeStampOffset"
					label="全局歌词时序偏移（秒）"
					formatLabel={(v: number) => {
						if (v === 0) {
							return "不调整";
						} else if (v < 0) {
							return `推迟 ${(-v).toFixed(1)} 秒`;
						} else {
							return `提前 ${v.toFixed(1)} 秒`;
						}
					}}
					min={-10}
					step={0.1}
					defaultValue={0}
					max={10}
				/>
			</GroupBox>
			<GroupBox>
				<SwitchConfigComponent
					settingKey="enableEditor"
					label="启用歌词编辑器连接"
					description="请勿开启！"
					defaultValue={false}
				/>
			</GroupBox>
		</>
	);
};

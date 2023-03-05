import { Button } from "../components/appkit/button";
import { GroupBox, GroupBoxDevider } from "../components/appkit/group-box";
import {
	SliderConfigComponent,
	SwitchConfigComponent,
} from "./config-components";

export const OtherStyleSettings: React.FC = () => {
	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					settingKey="autoHideControlBar"
					label="鼠标静止时自动隐藏播放栏和标题栏"
				/>
				<GroupBoxDevider />
				<SliderConfigComponent
					step={0.5}
					min={1}
					max={30}
					formatLabel={(v: number) => `${v} 秒`}
					settingKey="autoHideDuration"
					label="鼠标静止隐藏间隔（秒）"
				/>
			</GroupBox>
			<GroupBox>
				<SwitchConfigComponent
					settingKey="usePingFangFont"
					label="播放页面使用苹果系字体"
					description="需要系统预先安装字体，安装后需要重启网易云客户端方可使用。英文部分将会使用 SF Pro，中文部分将会使用苹方。"
				/>
				<GroupBoxDevider />
				<div style={{
					display: "flex",
					justifyContent: "flex-end",
				}}>
				<Button
					onClick={() => {
						betterncm.ncm.openUrl(
							"https://ghproxy.com/https://github.com/prchann/fonts/archive/refs/heads/main.zip",
						);
					}}
				>
					点此下载安装相关字体
				</Button>
				</div>
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

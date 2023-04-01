import { Alert, Select, Space } from "@mantine/core";
import { showNotification, hideNotification } from "@mantine/notifications";
import * as React from "react";
import { useConfig, useConfigValueBoolean } from "../api/react";
import { error } from "../utils/logger";
import {
	installLatestBranchVersion,
	useHasUpdates,
	useInstallableBranches,
	useLatestVersion,
} from "../utils/updater";
import { SwitchConfigComponent } from "./config-components";
import { Button } from "../components/appkit/button";
import { GroupBox } from "../components/appkit/group-box";
import AMLLIcon from "../assets/amll-icon.svg";

export const AboutPage: React.FC = () => {
	const latestVersion = useLatestVersion();
	const hasUpdates = useHasUpdates();
	const [updateBranch, setUpdateBranch] = useConfig("updateBranch", "main");
	const enableUpdateBranch = useConfigValueBoolean("enableUpdateBranch", false);
	const installableBranch = useInstallableBranches();
	const [updating, setUpdating] = React.useState(false);
	const isMRBNCM = React.useMemo(() => betterncm.isMRBNCM ?? false, []);
	return (
		<div className="amll-about">
			<div className="amll-icon">
				<AMLLIcon />
			</div>
			<div className="amll-name">Apple Music-like lyrics</div>
			<div className="version">
				{plugin.mainPlugin.manifest.version} (
				{plugin.mainPlugin.manifest.commit})
			</div>
			{enableUpdateBranch && (
				<div className="current-branch">当前分支：{updateBranch}</div>
			)}
			{hasUpdates ? (
				<div className="update-tip has-update">
					Github 有可用更新：{latestVersion}
				</div>
			) : (
				<div className="update-tip">已是最新版本</div>
			)}
			<div className="author">By SteveXMH</div>

			{hasUpdates && (
				<div className="update-btn">
					<Button
						disabled={updating}
						accent
						onClick={async () => {
							try {
								setUpdating(true);
								showNotification({
									id: "updater-progress",
									title: "正在更新 AMLL！",
									message:
										"完成安装后会自动重启网易云，请不要手动关闭网易云音乐！",
									disallowClose: true,
									loading: true,
									autoClose: false,
								});

								await installLatestBranchVersion(updateBranch);

								showNotification({
									title: "AMLL 更新成功！",
									message:
										"看起来网易云没有自动重启，请手动重启网易云以完成更新！",
									color: "green",
								});

								betterncm_native.app.restart();
							} catch (err) {
								error(err);
								showNotification({
									title: "AMLL 更新失败",
									color: "red",
									message: String(err),
								});
								setUpdating(false);
							} finally {
								hideNotification("updater-progress");
							}
						}}
					>
						升级
					</Button>
				</div>
			)}

			<div className="ext-links">
				<Button
					onClick={() => {
						betterncm.ncm.openUrl(
							"https://github.com/Steve-xmh/applemusic-like-lyrics",
						);
					}}
				>
					访问 Github 仓库
				</Button>
				<Button
					onClick={() => {
						betterncm.ncm.openUrl(
							"https://github.com/Steve-xmh/applemusic-like-lyrics/issues/new",
						);
					}}
				>
					编写 Issue 提交 BUG
				</Button>
			</div>
			<GroupBox>
				<SwitchConfigComponent
					settingKey="enableAutoCheckUpdate"
					label="开启网易云时检查插件更新并提醒"
					defaultValue={true}
				/>
			</GroupBox>
			{!isMRBNCM && (
				<Alert
					sx={{ margin: "16px 0" }}
					color="blue"
					title="Apple Music-like lyrics 还有定制版本的 BetterNCM 哦！"
				>
					<div>
						为了更好地实现作者的一些功能，特地重写了一份专用的 BetterNCM 哦
					</div>
					<Space h="sm" />
					<div>可以实现音频可视化，性能提升还有更多！</div>
					<Space h="md" />
					<Button
						onClick={() =>
							betterncm.ncm.openUrl("https://github.com/Steve-xmh/mrbncm")
						}
					>
						来试试吧！
					</Button>
				</Alert>
			)}
			{enableUpdateBranch && (
				<Alert
					sx={{ margin: "16px 0" }}
					color="yellow"
					title="警告：开发分支版本已启用"
				>
					<div>
						AMLL 的开发版本可以体验到最新的效果和巨量的 BUG
						和各种莫名其妙的问题和卡顿。
					</div>
					<div>严重时还有可能导致网易云原地爆炸！</div>
					<div>故仅供尝鲜，不要作为常用版本使用！</div>
				</Alert>
			)}
			<GroupBox>
				<SwitchConfigComponent
					settingKey="enableUpdateBranch"
					label="启用开发分支版本更新检查"
					disabled={updating}
				/>
			</GroupBox>
			{enableUpdateBranch && (
				<Select
					label="更新分支"
					value={updateBranch}
					disabled={updating}
					onChange={setUpdateBranch}
					data={installableBranch.map((v) => ({
						label: v === "main" ? "正式稳定版本分支" : `${v} 分支`,
						value: v,
					}))}
				/>
			)}
		</div>
	);
};

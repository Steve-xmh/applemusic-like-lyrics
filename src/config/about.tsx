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
import { isNCMV3 } from "../utils";

export const AboutPage: React.FC = () => {
	const latestVersion = useLatestVersion();
	const hasUpdates = useHasUpdates();
	const [updateBranch, setUpdateBranch] = useConfig("updateBranch", "main");
	const enableUpdateBranch = useConfigValueBoolean("enableUpdateBranch", false);
	const installableBranch = useInstallableBranches();
	const [updating, setUpdating] = React.useState(false);
	const isMRBNCM = React.useMemo(() => betterncm.isMRBNCM ?? isNCMV3(), []);
	return (
		<div className="amll-about">
			<div className="amll-icon">
				<img
					alt="AMLL Icon"
					src="data:image/svg+xml,%3Csvg width='136' height='136' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cg filter='url(%23prefix__filter0_di_208_214)'%3E%3Crect x='4' width='128' height='128' rx='32' fill='url(%23prefix__paint0_linear_208_214)'/%3E%3Cg filter='url(%23prefix__filter1_d_208_214)' fill='%23fff'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='M58.312 42.008c-.163.015-1.61.267-1.783.301l-20.025 3.967-.007.002c-.522.108-.932.29-1.248.551-.382.315-.594.76-.674 1.277-.017.11-.045.335-.045.665v24.606c0 .575-.047 1.134-.444 1.61-.396.476-.887.619-1.461.733l-1.308.259c-1.655.327-2.73.55-3.706.92-.932.355-1.63.807-2.186 1.38-1.102 1.134-1.55 2.672-1.396 4.112a5.114 5.114 0 001.662 3.274 5.078 5.078 0 002.431 1.224c.998.197 2.06.129 3.614-.18.827-.163 1.602-.419 2.34-.847a5.838 5.838 0 001.843-1.674c.49-.689.806-1.455.98-2.269.18-.84.223-1.598.223-2.436V58.142c0-1.143.33-1.444 1.269-1.668 0 0 16.644-3.297 17.42-3.445 1.084-.204 1.595.099 1.595 1.214v14.568c0 .577-.005 1.162-.406 1.64-.397.475-.887.619-1.462.733l-1.308.258c-1.654.328-2.73.55-3.705.921-.932.355-1.63.807-2.186 1.38a5.154 5.154 0 00-1.435 4.112c.13 1.23.733 2.405 1.7 3.274a5.08 5.08 0 002.432 1.213c.997.196 2.06.127 3.614-.18.827-.164 1.602-.408 2.339-.836a5.837 5.837 0 001.843-1.674c.49-.69.807-1.455.98-2.27.18-.839.188-1.598.188-2.436v-31.2c.004-1.132-.605-1.83-1.688-1.738z'/%3E%3Crect x='72' y='30' width='42' height='6' rx='3'/%3E%3Crect x='72' y='72' width='42' height='6' rx='3'/%3E%3Crect x='72' y='51' width='42' height='6' rx='3'/%3E%3Crect x='72' y='93' width='42' height='6' rx='3'/%3E%3C/g%3E%3C/g%3E%3Cdefs%3E%3Cfilter id='prefix__filter0_di_208_214' x='0' y='0' width='136' height='136' filterUnits='userSpaceOnUse' color-interpolation-filters='sRGB'%3E%3CfeFlood flood-opacity='0' result='BackgroundImageFix'/%3E%3CfeColorMatrix in='SourceAlpha' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0' result='hardAlpha'/%3E%3CfeOffset dy='4'/%3E%3CfeGaussianBlur stdDeviation='2'/%3E%3CfeComposite in2='hardAlpha' operator='out'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0'/%3E%3CfeBlend in2='BackgroundImageFix' result='effect1_dropShadow_208_214'/%3E%3CfeBlend in='SourceGraphic' in2='effect1_dropShadow_208_214' result='shape'/%3E%3CfeColorMatrix in='SourceAlpha' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0' result='hardAlpha'/%3E%3CfeOffset/%3E%3CfeGaussianBlur stdDeviation='2'/%3E%3CfeComposite in2='hardAlpha' operator='arithmetic' k2='-1' k3='1'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0'/%3E%3CfeBlend in2='shape' result='effect2_innerShadow_208_214'/%3E%3C/filter%3E%3Cfilter id='prefix__filter1_d_208_214' x='20' y='26' width='98' height='79' filterUnits='userSpaceOnUse' color-interpolation-filters='sRGB'%3E%3CfeFlood flood-opacity='0' result='BackgroundImageFix'/%3E%3CfeColorMatrix in='SourceAlpha' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0' result='hardAlpha'/%3E%3CfeOffset dy='1'/%3E%3CfeGaussianBlur stdDeviation='2'/%3E%3CfeComposite in2='hardAlpha' operator='out'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0'/%3E%3CfeBlend in2='BackgroundImageFix' result='effect1_dropShadow_208_214'/%3E%3CfeBlend in='SourceGraphic' in2='effect1_dropShadow_208_214' result='shape'/%3E%3C/filter%3E%3ClinearGradient id='prefix__paint0_linear_208_214' x1='68' y1='0' x2='68' y2='128' gradientUnits='userSpaceOnUse'%3E%3Cstop stop-color='%23FB5C74'/%3E%3Cstop offset='1' stop-color='%23FA233B'/%3E%3C/linearGradient%3E%3C/defs%3E%3C/svg%3E"
				/>
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

								const targetBranch = installableBranch.find(
									(b) => b.branch === updateBranch,
								);

								if (targetBranch)
									await installLatestBranchVersion(
										targetBranch.branch,
										targetBranch.path,
									);

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
						label: v.branch === "main" ? "正式稳定版本分支" : `${v.branch} 分支（位于 ${v.path}）`,
						value: v.branch,
					}))}
				/>
			)}
		</div>
	);
};

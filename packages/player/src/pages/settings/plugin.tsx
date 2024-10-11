import { ExclamationTriangleIcon, TrashIcon } from "@radix-ui/react-icons";
import {
	Avatar,
	Box,
	Button,
	Callout,
	Card,
	Flex,
	IconButton,
	Switch,
	Text,
} from "@radix-ui/themes";
import { path } from "@tauri-apps/api";
import { BaseDirectory } from "@tauri-apps/api/path";
import { open as dialogOpen } from "@tauri-apps/plugin-dialog";
import { copyFile, mkdir, rename } from "@tauri-apps/plugin-fs";
import { open as shellOpen } from "@tauri-apps/plugin-shell";
import { atom, useAtomValue, useStore } from "jotai";
import type { FC } from "react";
import { Trans, useTranslation } from "react-i18next";
import {
	PluginLoadResult,
	pluginDirAtom,
	pluginMetaAtom,
} from "../../states/plugin";
import { restartApp } from "../../utils/player";

const requireRestartAtom = atom(false);

export const PluginTab: FC = () => {
	const store = useStore();
	const { t } = useTranslation("translation");
	const pluginMetas = useAtomValue(pluginMetaAtom);
	const requireRestart = useAtomValue(requireRestartAtom);

	return (
		<>
			<Callout.Root color="red" my="2">
				<Callout.Icon>
					<ExclamationTriangleIcon />
				</Callout.Icon>
				<Callout.Text>
					<Trans i18nKey="settings.plugin.safetyWarning">
						插件将可以访问并操作你的所有数据，包括你的歌单、播放信息等数据，请务必确保插件来源可靠安全，并只安装你信任的插件！作者不承担使用任何插件后产生的一切后果！
					</Trans>
				</Callout.Text>
			</Callout.Root>
			<Callout.Root color="orange" my="2">
				<Callout.Icon>
					<ExclamationTriangleIcon />
				</Callout.Icon>
				<Callout.Text>
					<Trans i18nKey="settings.plugin.wipWarning">
						插件接口功能仍在开发中，其插件接口有可能随时变更，敬请留意！
					</Trans>
				</Callout.Text>
			</Callout.Root>

			<Flex gap="2" wrap="wrap">
				<Button
					onClick={async () => {
						const pluginDir = await store.get(pluginDirAtom);
						const pluginFiles = await dialogOpen({
							title: t(
								"settings.plugin.install.title",
								"请选择需要载入的 JavaScript 插件文件",
							),
							filters: [
								{
									name: t("common.dialog.filter.js", "JavaScript 文件 (*.js)"),
									extensions: ["js"],
								},
								{
									name: t("common.dialog.filter.all", "全部文件 (*.*)"),
									extensions: [],
								},
							],
							multiple: true,
						});
						if (pluginFiles === null) return;
						if (pluginFiles.length === 0) return;

						await mkdir(pluginDir, {
							recursive: true,
							baseDir: BaseDirectory.AppData,
						});
						for (const pluginFile of pluginFiles) {
							const pluginName = await path.basename(pluginFile);
							await copyFile(
								pluginFile,
								await path.join(pluginDir, pluginName),
							);
						}
						store.set(pluginMetaAtom);
					}}
				>
					<Trans i18nKey="settings.plugin.installPlugins">安装插件</Trans>
				</Button>
				<Button
					variant="soft"
					onClick={async () => {
						const appDir = await path.appDataDir();
						const pluginsDir = await path.join(appDir, "plugins");
						await mkdir(pluginsDir, {
							recursive: true,
							baseDir: BaseDirectory.AppData,
						});
						await shellOpen(pluginsDir);
					}}
				>
					<Trans i18nKey="settings.plugin.openPluginDirectory">
						打开插件文件夹
					</Trans>
				</Button>
				<Button
					variant={requireRestart ? "solid" : "soft"}
					onClick={() => restartApp()}
				>
					<Trans i18nKey="page.settings.others.restartProgram">重启程序</Trans>
				</Button>
			</Flex>
			{pluginMetas.map((meta) => (
				<Card key={`${meta.fileName}-${meta.id}`} my="2">
					<Flex align="center" gap="4">
						<Avatar
							size="5"
							fallback={<div />}
							src={String(meta.icon)}
							style={{
								color: "white",
							}}
						/>
						{meta.loadResult === PluginLoadResult.Success && (
							<Flex flexGrow="1" direction="column" justify="center">
								<Text weight="bold">{t("name", meta.id, { ns: meta.id })}</Text>
								<Text size="2">{meta.id}</Text>
							</Flex>
						)}
						{meta.loadResult === PluginLoadResult.Disabled && (
							<Flex flexGrow="1" direction="column" justify="center">
								<Text weight="bold">{t("name", meta.id, { ns: meta.id })}</Text>
								<Text size="2">{meta.id}</Text>
							</Flex>
						)}
						{meta.loadResult === PluginLoadResult.InvaildPluginFile && (
							<Flex flexGrow="1" direction="column" justify="center">
								<Box>
									<Text color="gray">{meta.fileName}</Text>
								</Box>
								<Text color="gray" size="2">
									<Trans i18nKey="plugin.error.invaildPluginFile">
										无效插件文件
									</Trans>
								</Text>
							</Flex>
						)}
						{meta.loadResult === PluginLoadResult.MissingDependency && (
							<Flex flexGrow="1" direction="column" justify="center">
								<Box>
									<Text color="gray">{meta.fileName}</Text>
								</Box>
								<Text color="gray" size="2">
									<Trans i18nKey="plugin.error.missingDependency">
										缺失依赖项
									</Trans>
								</Text>
							</Flex>
						)}
						{meta.loadResult === PluginLoadResult.MissingMetadata && (
							<Flex flexGrow="1" direction="column" justify="center">
								<Box>
									<Text color="gray">{meta.fileName}</Text>
								</Box>
								<Text color="gray" size="2">
									<Trans i18nKey="plugin.error.missingMetadata">
										缺失必需元数据
									</Trans>
								</Text>
							</Flex>
						)}
						{meta.loadResult === PluginLoadResult.PluginIdConflict && (
							<Flex flexGrow="1" direction="column" justify="center">
								<Box>
									<Text color="gray">{meta.id}</Text>
								</Box>
								<Text color="gray" size="2">
									<Trans i18nKey="plugin.error.pluginIdConflict">
										插件 ID 冲突
									</Trans>
								</Text>
							</Flex>
						)}
						<Flex flexGrow="1" direction="column" justify="center">
							<Text color="gray" align="right" size="2">
								{meta.version}
							</Text>
							<Text color="gray" align="right" size="2">
								{meta.fileName}
							</Text>
						</Flex>
						<Switch
							disabled={
								meta.loadResult !== PluginLoadResult.Success &&
								meta.loadResult !== PluginLoadResult.Disabled
							}
							checked={meta.loadResult === PluginLoadResult.Success}
							onCheckedChange={async () => {
								const pluginDir = await store.get(pluginDirAtom);
								const pluginPath = await path.join(pluginDir, meta.fileName);
								if (pluginPath.endsWith(".disabled")) {
									await rename(
										pluginPath,
										pluginPath.substring(0, pluginPath.length - 9),
									);
								} else {
									await rename(pluginPath, `${pluginPath}.disabled`);
								}
								store.set(pluginMetaAtom);
								store.set(requireRestartAtom, true);
							}}
						/>
						<IconButton variant="soft">
							<TrashIcon />
						</IconButton>
					</Flex>
				</Card>
			))}
		</>
	);
};

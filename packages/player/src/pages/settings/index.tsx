import { ArrowLeftIcon } from "@radix-ui/react-icons";
import {
	Box,
	Button,
	type ButtonProps,
	Container,
	Flex,
	Separator,
	Tooltip,
} from "@radix-ui/themes";
import { atom, useAtom, useAtomValue } from "jotai";
import { type FC, Suspense } from "react";
import { useTranslation } from "react-i18next";
import { loadedPluginsAtom } from "../../states/plugin";
import AMLLPlayerSettingIcon from "./amll-player-setting.svg?react";
import styles from "./index.module.css";
import { PlayerSettingsTab } from "./player";
import { PluginTab } from "./plugin";
import PluginManageIcon from "./plugin-manage.svg?react";

const currentPageAtom = atom("amll-player");

const TabButton: FC<ButtonProps> = ({ children, content, ...props }) => {
	return (
		<Tooltip content={content}>
			<Button mb="2" className={styles.tabButton} {...props}>
				{children}
			</Button>
		</Tooltip>
	);
};

const loadedPluginsWithSettingsAtom = atom((get) => {
	const loadedPlugins = get(loadedPluginsAtom);
	return loadedPlugins.filter((v) => v.context.settingComponent);
});

export const SettingsPage: FC = () => {
	const [currentPage, setCurrentPage] = useAtom(currentPageAtom);
	const loadedPlugins = useAtomValue(loadedPluginsWithSettingsAtom);
	const { t } = useTranslation();

	return (
		<>
			<Container
				mx={{
					initial: "4",
					sm: "9",
				}}
				mb="150px"
			>
				<Flex direction="row" mt="7" gap="4">
					<Box>
						<TabButton
							variant="soft"
							content={t("common.page.back", "返回")}
							onClick={() => history.back()}
						>
							<ArrowLeftIcon />
						</TabButton>
						<TabButton
							content={t("settings.player.tab", "AMLL Player 设置")}
							color={currentPage === "amll-player" ? "red" : "gray"}
							onClick={() => setCurrentPage("amll-player")}
						>
							<AMLLPlayerSettingIcon />
						</TabButton>
						<TabButton
							content={t("settings.plugin.tab", "插件管理")}
							color={currentPage === "plugins" ? "indigo" : "gray"}
							onClick={() => setCurrentPage("plugins")}
						>
							<PluginManageIcon />
						</TabButton>
						<Separator size="4" my="2" />
						{loadedPlugins.map((plugin) => {
							const id = plugin.pluginMeta.id;
							return (
								<TabButton
									content={t("name", id, { ns: id })}
									key={id}
									color={currentPage === `plugin.${id}` ? "indigo" : "gray"}
									onClick={() => setCurrentPage(`plugin.${id}`)}
								>
									<img src={String(plugin.context.pluginMeta.icon)} />
								</TabButton>
							);
						})}
					</Box>
					<Box flexGrow="1" minWidth="0">
						{currentPage === "amll-player" && <PlayerSettingsTab />}
						{currentPage === "plugins" && (
							<Suspense>
								<PluginTab />
							</Suspense>
						)}
						{loadedPlugins.map((plugin) => {
							const id = plugin.pluginMeta.id;
							const SettingComponent = plugin.context.settingComponent!;
							return (
								currentPage === `plugin.${id}` && <SettingComponent key={id} />
							);
						})}
					</Box>
				</Flex>
			</Container>
		</>
	);
};

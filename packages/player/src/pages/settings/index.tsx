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
import { loadedExtensionAtom } from "../../states/extension";
import AMLLPlayerSettingIcon from "./amll-player-setting.svg?react";
import { ExtensionTab } from "./extension";
import ExtensionManageIcon from "./extension-manage.svg?react";
import styles from "./index.module.css";
import { PlayerSettingsTab } from "./player";

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

const loadedExtensionsWithSettingsAtom = atom((get) => {
	const loadedExtensions = get(loadedExtensionAtom);
	return loadedExtensions.filter(
		(v) => v.context.registeredInjectPointComponent.settings,
	);
});

export const SettingsPage: FC = () => {
	const [currentPage, setCurrentPage] = useAtom(currentPageAtom);
	const loadedExtensions = useAtomValue(loadedExtensionsWithSettingsAtom);
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
							content={t("settings.extension.tab", "扩展程序管理")}
							color={currentPage === "extension" ? "indigo" : "gray"}
							onClick={() => setCurrentPage("extension")}
						>
							<ExtensionManageIcon />
						</TabButton>
						<Separator size="4" my="2" />
						{loadedExtensions.map((extension) => {
							const id = extension.extensionMeta.id;
							return (
								<TabButton
									content={t("name", id, { ns: id })}
									key={id}
									color={currentPage === `extension.${id}` ? "indigo" : "gray"}
									onClick={() => setCurrentPage(`extension.${id}`)}
								>
									<img src={String(extension.context.extensionMeta.icon)} />
								</TabButton>
							);
						})}
					</Box>
					<Box flexGrow="1" minWidth="0">
						{currentPage === "amll-player" && <PlayerSettingsTab />}
						{currentPage === "extension" && (
							<Suspense>
								<ExtensionTab />
							</Suspense>
						)}
						{loadedExtensions.map((extension) => {
							const id = extension.extensionMeta.id;
							const ExtensionComponent =
								extension.context.registeredInjectPointComponent.settings;
							return (
								currentPage === `extension.${id}` &&
								ExtensionComponent && <ExtensionComponent key={id} />
							);
						})}
					</Box>
				</Flex>
			</Container>
		</>
	);
};

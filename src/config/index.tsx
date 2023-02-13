import * as React from "react";
import { ThemeProvider } from "..";
import { createRoot } from "react-dom/client";
import { Tabs, Container, Indicator, Space } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import { AboutPage } from "./about";
import { useHasWarnings, WarningsList } from "./warnings";
import { LyricSettings } from "./lyric";
import { LyricStyleSettings } from "./lyric-style";
import { SongInfoStyleSettings } from "./song-info-style";
import { OtherStyleSettings } from "./other-style";
import { LyricSourceSettings } from "./lyric-source";
import { CustomCSSSettings } from "./custom-css";
import { useHasUpdates } from "../utils/updater";
import { Provider } from "jotai";
import { showNotification } from "@mantine/notifications";
import { BackgroundSettings } from "./background";
import { getConfig } from "./core";

const PanelWrapper: React.FC<React.PropsWithChildren> = (props) => {
	return (
		<Container fluid style={{ paddingLeft: "16px" }}>
			{props.children}
			<Space h="xl" />
		</Container>
	);
};

const ConfigComponent: React.FC = () => {
	const hasWarnings = useHasWarnings();
	const hasUpdates = useHasUpdates();
	const [checkedUpdate, setCheckedUpdate] = React.useState(false);

	React.useEffect(() => {
		if (
			!checkedUpdate &&
			hasUpdates &&
			getConfig("enableAutoCheckUpdate", "true") === "true"
		) {
			setCheckedUpdate(true);
			showNotification({
				title: "AMLL 有可用更新！",
				message: "前往 AMLL 插件设置 - 关于页面 以更新插件！",
			});
		}
	}, [checkedUpdate, hasUpdates]);

	return (
		<Tabs
			className="am-lyrics-settings"
			keepMounted={false}
			defaultValue="about"
			orientation="vertical"
		>
			<Tabs.List>
				{hasWarnings && (
					<Tabs.Tab value="warnings">
						<Indicator offset={-3} size={6} color="yellow">
							插件警告
						</Indicator>
					</Tabs.Tab>
				)}
				<Tabs.Tab value="lyric">歌词设置</Tabs.Tab>
				<Tabs.Tab value="lyric-style">歌词样式设置</Tabs.Tab>
				<Tabs.Tab value="song-info-style">歌曲信息样式设置</Tabs.Tab>
				<Tabs.Tab value="background">背景设置</Tabs.Tab>
				<Tabs.Tab value="other-style">其它样式设置</Tabs.Tab>
				<Tabs.Tab value="lyric-source">EAPI 函数设置</Tabs.Tab>
				<Tabs.Tab value="custom-css">自定义 CSS 设置</Tabs.Tab>
				<Tabs.Tab value="about">
					{hasUpdates ? (
						<Indicator offset={-3} size={6} color="yellow">
							关于
						</Indicator>
					) : (
						<>关于</>
					)}
				</Tabs.Tab>
			</Tabs.List>

			<Tabs.Panel value="warnings">
				<PanelWrapper>
					<WarningsList />
				</PanelWrapper>
			</Tabs.Panel>
			<Tabs.Panel value="lyric">
				<PanelWrapper>
					<LyricSettings />
				</PanelWrapper>
			</Tabs.Panel>
			<Tabs.Panel value="lyric-style">
				<PanelWrapper>
					<LyricStyleSettings />
				</PanelWrapper>
			</Tabs.Panel>
			<Tabs.Panel value="song-info-style">
				<PanelWrapper>
					<SongInfoStyleSettings />
				</PanelWrapper>
			</Tabs.Panel>
			<Tabs.Panel value="background">
				<PanelWrapper>
					<BackgroundSettings />
				</PanelWrapper>
			</Tabs.Panel>
			<Tabs.Panel value="other-style">
				<PanelWrapper>
					<OtherStyleSettings />
				</PanelWrapper>
			</Tabs.Panel>
			<Tabs.Panel value="lyric-source">
				<PanelWrapper>
					<LyricSourceSettings />
				</PanelWrapper>
			</Tabs.Panel>
			<Tabs.Panel value="custom-css">
				<PanelWrapper>
					<CustomCSSSettings />
				</PanelWrapper>
			</Tabs.Panel>
			<Tabs.Panel value="about">
				<PanelWrapper>
					<AboutPage />
				</PanelWrapper>
			</Tabs.Panel>
		</Tabs>
	);
};

plugin.onConfig(() => {
	const root = document.createElement("div");

	root.style.height = "100%";

	createRoot(root).render(
		<Provider>
			<ThemeProvider>
				<NotificationsProvider className="amll-notifications-provider">
					<ConfigComponent />
				</NotificationsProvider>
			</ThemeProvider>
		</Provider>,
	);

	return root;
});

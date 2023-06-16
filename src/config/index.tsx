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
import { CustomCSSSettings } from "./custom-css";
import { useHasUpdates } from "../utils/updater";
import { Provider } from "jotai";
import { showNotification } from "@mantine/notifications";
import { BackgroundSettings } from "./background";
import { getConfig } from "./core";
import { AppKitWindow, SidebarItem } from "../components/appkit/window";
import { LyricSourceSettings } from "./lyric-source";

const PanelWrapper: React.FC<React.PropsWithChildren> = (props) => {
	return (
		<Container fluid style={{ paddingLeft: "16px" }}>
			{props.children}
			<Space h="xl" />
		</Container>
	);
};

const TABS = [
	{
		id: "genernal",
		name: "常规",
		content: () => <LyricSettings />,
	},
	{
		id: "lyric",
		name: "歌词样式",
		content: () => <LyricStyleSettings />,
	},
	{
		id: "song-info",
		name: "歌曲信息样式",
		content: () => <SongInfoStyleSettings />,
	},
	{
		id: "lyric-source",
		name: "自定义歌词源",
		content: () => <LyricSourceSettings />,
	},
	{
		id: "background",
		name: "背景样式",
		content: () => <BackgroundSettings />,
	},
	{
		id: "other",
		name: "杂项",
		content: () => <OtherStyleSettings />,
	},
];

const TABS_NAME = {
	about: "关于 Apple Music-like lyrics",
};

for (const tabItem of TABS) {
	TABS_NAME[tabItem.id] = tabItem.name;
}

export const WindowedConfigComponent: React.FC<{
	onClose?: React.MouseEventHandler;
}> = (props) => {
	const hasUpdates = useHasUpdates();
	const [checkedUpdate, setCheckedUpdate] = React.useState(false);
	const [tab, setTab] = React.useState("genernal");
	const tabContent = React.useMemo(() => {
		if (tab === "about") {
			return () => <AboutPage />;
		}
		const t = TABS.find((v) => v.id === tab);
		if (t) {
			return t.content;
		} else {
			return () => <></>;
		}
	}, [tab]);

	React.useEffect(() => {
		if (
			!checkedUpdate &&
			hasUpdates &&
			getConfig("enableAutoCheckUpdate", "true") === "true"
		) {
			setCheckedUpdate(true);
		}
	}, [checkedUpdate, hasUpdates]);

	return (
		<AppKitWindow
			zIndex={127}
			title={TABS_NAME[tab] ?? ""}
			width={600}
			height={350}
			sidebarItems={TABS.map((v) => (
				<SidebarItem onClick={() => setTab(v.id)} selected={tab === v.id}>
					{v.name}
				</SidebarItem>
			))}
			sidebarBottomItems={
				<>
					<SidebarItem
						onClick={() => setTab("about")}
						selected={tab === "about"}
					>
						关于 Apple Music-like lyrics
					</SidebarItem>
				</>
			}
			onClose={props.onClose}
			hideMinimizeBtn
			hideZoomBtn
		>
			{tabContent()}
		</AppKitWindow>
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
				<Tabs.Tab value="lyric-source">自定义歌词源</Tabs.Tab>
				<Tabs.Tab value="background">背景设置</Tabs.Tab>
				<Tabs.Tab value="other-style">其它样式设置</Tabs.Tab>
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
			<Tabs.Panel value="lyric-source">
				<PanelWrapper>
					<LyricSourceSettings />
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
		<div>
			由于产生了奇怪的布局问题，请在歌词页面内打开插件设置，如有不便还请谅解！
		</div>,
	);

	return root;
});

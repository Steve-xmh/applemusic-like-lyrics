import { FC, Suspense } from "react";
import { AppKitWindow, AppKitWindowFrame, SidebarItem } from "../appkit/window";
import { PlayerConfig } from "./player";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import "./config.sass";
import { LyricConfig } from "./lyric";
import { LyricStyleConfig } from "./music";
import { AboutConfig } from "./about";
import { OtherConfig } from "./other";
import { FullSpinner, Spinner } from "../appkit/spinner/spinner";
import { BackgroundConfig } from "./background";
import { LyricSourceConfig } from "./lyric-source";
import { DebugConfig } from "./debug";
import { AMLLEnvironment, amllEnvironmentAtom } from "../../injector";

export const configPageAtom = atom("lyric");

const ConfigSidebarItems: FC = () => {
	const [configPage, setConfigPage] = useAtom(configPageAtom);
	return (
		<>
			<SidebarItem
				selected={configPage === "lyric"}
				onClick={() => setConfigPage("lyric")}
			>
				歌词
			</SidebarItem>
			<SidebarItem
				selected={configPage === "music"}
				onClick={() => setConfigPage("music")}
			>
				歌曲信息
			</SidebarItem>
			<SidebarItem
				selected={configPage === "background"}
				onClick={() => setConfigPage("background")}
			>
				背景
			</SidebarItem>
			<SidebarItem
				selected={configPage === "lyric-source"}
				onClick={() => setConfigPage("lyric-source")}
			>
				歌词源
			</SidebarItem>
			<SidebarItem
				selected={configPage === "player"}
				onClick={() => setConfigPage("player")}
			>
				歌词播放器
			</SidebarItem>
			<SidebarItem
				selected={configPage === "other"}
				onClick={() => setConfigPage("other")}
			>
				杂项
			</SidebarItem>
			<SidebarItem
				selected={configPage === "debug"}
				onClick={() => setConfigPage("debug")}
			>
				调试
			</SidebarItem>
		</>
	);
};

const ConfigSidebarBottomItems: FC = () => {
	const [configPage, setConfigPage] = useAtom(configPageAtom);
	const amllEnvironment = useAtomValue(amllEnvironmentAtom);
	return (
		<>
			<SidebarItem
				selected={configPage === "about"}
				onClick={() => setConfigPage("about")}
			>
				{amllEnvironment === AMLLEnvironment.BetterNCM &&
					"关于 Apple Music-like lyrics"}
				{amllEnvironment === AMLLEnvironment.AMLLPlayer && "关于 AMLL Player"}
				{amllEnvironment === AMLLEnvironment.Component && "关于 AMLL 组件库"}
			</SidebarItem>
		</>
	);
};

const ConfigContent: FC = () => {
	const configPage = useAtomValue(configPageAtom);
	return (
		<div id="amll-config-content">
			<Suspense fallback={<FullSpinner />}>
				{configPage === "lyric" && <LyricConfig />}
				{configPage === "music" && <LyricStyleConfig />}
				{configPage === "background" && <BackgroundConfig />}
				{configPage === "lyric-source" && <LyricSourceConfig />}
				{configPage === "player" && <PlayerConfig />}
				{configPage === "other" && <OtherConfig />}
				{configPage === "about" && <AboutConfig />}
				{configPage === "debug" && <DebugConfig />}
			</Suspense>
		</div>
	);
};

export const AMLLConfig: FC = () => {
	return (
		<AppKitWindowFrame
			sidebarItems={<ConfigSidebarItems />}
			sidebarBottomItems={<ConfigSidebarBottomItems />}
			id="amll-config"
		>
			<ConfigContent />
		</AppKitWindowFrame>
	);
};

export const amllConfigWindowedOpenedAtom = atom(false);

export const AMLLConfigWindowed: FC = () => {
	const [amllConfigWindowedOpened, setAMLLConfigWindowedOpened] = useAtom(
		amllConfigWindowedOpenedAtom,
	);
	return (
		<AppKitWindow
			sidebarItems={<ConfigSidebarItems />}
			sidebarBottomItems={<ConfigSidebarBottomItems />}
			width={600}
			height={350}
			open={amllConfigWindowedOpened}
			onClose={() => setAMLLConfigWindowedOpened(false)}
			id="amll-config"
		>
			<Suspense>
				<ConfigContent />
			</Suspense>
		</AppKitWindow>
	);
};

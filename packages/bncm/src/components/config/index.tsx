import { FC } from "react";
import { AppKitWindowFrame, SidebarItem } from "../appkit/window";
import { PlayerConfig } from "./player";
import { atom, useAtom, useAtomValue } from "jotai";
import "./config.sass";
import { LyricConfig } from "./lyric";
import { LyricStyleConfig } from "./music";

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
		</>
	);
};

const ConfigSidebarBottomItems: FC = () => {
	const [configPage, setConfigPage] = useAtom(configPageAtom);
	return (
		<>
			<SidebarItem
				selected={configPage === "about"}
				onClick={() => setConfigPage("about")}
			>
				关于 Apple Music-like lyrics
			</SidebarItem>
		</>
	);
};

const ConfigContent: FC = () => {
	const configPage = useAtomValue(configPageAtom);
	return (
		<div id="amll-config-content">
			{configPage === "player" && <PlayerConfig />}
			{configPage === "lyric" && <LyricConfig />}
			{configPage === "music" && <LyricStyleConfig />}
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

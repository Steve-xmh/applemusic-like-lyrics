import type { FC } from "react";
import Media from "react-media";
import { LyricPlayerHorizonal } from "./horizonal";
import { Background } from "./common/background";
import { LyricPlayerVertical } from "./vertical";
import { MainMenu } from "./common/main-menu";
import {
	AMLLConfigWindowed,
	amllConfigWindowedOpenedAtom,
} from "../components/config";
import { useAtomValue } from "jotai";
import { MusicOverrideWindow } from "./common/music-override-window";

export const LyricPlayer: FC = () => {
	const amllConfigWindowedOpened = useAtomValue(amllConfigWindowedOpenedAtom);
	return (
		<>
			<Background />
			<MainMenu />
			<Media
				queries={{
					vertical: "(orientation: portrait)",
					horizonal: "(orientation: landscape)",
				}}
			>
				{(matches) => (
					<>
						{matches.horizonal && <LyricPlayerHorizonal />}
						{matches.vertical && <LyricPlayerVertical />}
					</>
				)}
			</Media>
			{amllConfigWindowedOpened && <AMLLConfigWindowed />}
			<MusicOverrideWindow />
		</>
	);
};

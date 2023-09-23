import type { FC } from "react";
import Media from "react-media";
import { LyricPlayerHorizonal } from "./horizonal";
import { Background } from "./common/background";
import { LyricPlayerVertical } from "./vertical";
import { MainMenu } from "./common/main-menu";
import { AMLLConfigWindowed } from "../components/config";
import { MusicOverrideWindow } from "./common/music-override-window";

export const LyricPlayer: FC = () => {
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
			<AMLLConfigWindowed />
			<MusicOverrideWindow />
		</>
	);
};

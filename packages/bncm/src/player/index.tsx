import { type FC } from "react";
import Media from "react-media";
import { LyricPlayerHorizonal } from "./horizonal";
import { Background } from "./common/background";
import { LyricPlayerVertical } from "./vertical";
import { MainMenu } from "./common/main-menu";
import { AMLLConfigWindowed } from "../components/config";
import { MusicOverrideWindow } from "./common/music-override-window";
import { RightClickLyricMenu } from "./common/lyric-line-menu";
import { SuspenseLogger } from "../injector";

export const LyricPlayer: FC = () => {
	return (
		<>
			<SuspenseLogger text="Background">
				<Background />
			</SuspenseLogger>
			<SuspenseLogger text="MainMenu">
				<MainMenu />
			</SuspenseLogger>
			<SuspenseLogger text="RightClickLyricMenu">
				<RightClickLyricMenu />
			</SuspenseLogger>
			<Media
				queries={{
					vertical: "(orientation: portrait)",
					horizonal: "(orientation: landscape)",
				}}
			>
				{(matches) => (
					<>
						{matches.horizonal && (
							<SuspenseLogger text="LyricPlayerHorizonal">
								<LyricPlayerHorizonal />
							</SuspenseLogger>
						)}
						{matches.vertical && (
							<SuspenseLogger text="LyricPlayerVertical">
								<LyricPlayerVertical />
							</SuspenseLogger>
						)}
					</>
				)}
			</Media>
			<SuspenseLogger text="AMLLConfigWindowed">
				<AMLLConfigWindowed />
			</SuspenseLogger>
			<SuspenseLogger text="MusicOverrideWindow">
				<MusicOverrideWindow />
			</SuspenseLogger>
		</>
	);
};

import { Suspense, type FC } from "react";
import Media from "react-media";
import { LyricPlayerHorizonal } from "./horizonal";
import { Background } from "./common/background";
import { LyricPlayerVertical } from "./vertical";
import { MainMenu } from "./common/main-menu";
import { AMLLConfigWindowed } from "../components/config";
import { MusicOverrideWindow } from "./common/music-override-window";
import { RightClickLyricMenu } from "./common/lyric-line-menu";

export const LyricPlayer: FC = () => {
	return (
		<>
			<Background />
			<Suspense>
				<MainMenu />
			</Suspense>
			<Suspense>
				<RightClickLyricMenu />
			</Suspense>
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
			<Suspense>
				<AMLLConfigWindowed />
			</Suspense>
			<Suspense>
				<MusicOverrideWindow />
			</Suspense>
		</>
	);
};

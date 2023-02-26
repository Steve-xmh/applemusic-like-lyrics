import { useAtom, useAtomValue } from "jotai";
import { currentPlayModeAtom, playStateAtom } from "../../core/states";
import { PlayMode, switchPlayMode } from "../../utils";

import IconPause from "../../assets/icon_pause.svg";
import IconRewind from "../../assets/icon_rewind.svg";
import IconForward from "../../assets/icon_forward.svg";
import IconShuffle from "../../assets/icon_shuffle.svg";
import IconShuffleOn from "../../assets/icon_shuffle_on.svg";
import IconRepeat from "../../assets/icon_repeat.svg";
import IconRepeatOn from "../../assets/icon_repeat_on.svg";
import IconPlay from "../../assets/icon_play.svg";
import { PlayState } from "../../api";

export const PlayControls: React.FC = () => {
	const [currentPlayMode, setCurrentPlayMode] = useAtom(currentPlayModeAtom);
	const playState = useAtomValue(playStateAtom);

	return (
		<div className="am-music-controls">
			<button
				className="am-music-track-shuffle"
				onClick={() => {
					if (currentPlayMode === PlayMode.Random) {
						switchPlayMode(PlayMode.Order);
						setCurrentPlayMode(PlayMode.Order);
					} else {
						switchPlayMode(PlayMode.Random);
						setCurrentPlayMode(PlayMode.Random);
					}
				}}
			>
				{currentPlayMode === PlayMode.Random ? (
					<IconShuffleOn color="#FFFFFF" />
				) : (
					<IconShuffle color="#FFFFFF" />
				)}
			</button>
			<button
				className="am-music-track-prev"
				onClick={() => {
					document
						.querySelector<HTMLButtonElement>("#main-player .btnc-prv")
						?.click();
				}}
			>
				<IconRewind color="#FFFFFF" />
			</button>
			<button
				className="am-music-play"
				onClick={() => {
					if (playState === PlayState.Playing) {
						document
							.querySelector<HTMLButtonElement>("#main-player .btnp-pause")
							?.click();
					} else {
						document
							.querySelector<HTMLButtonElement>("#main-player .btnp-play")
							?.click();
					}
				}}
			>
				{playState === PlayState.Playing ? (
					<IconPause color="#FFFFFF" />
				) : (
					<IconPlay color="#FFFFFF" />
				)}
			</button>
			<button
				className="am-music-track-next"
				onClick={() => {
					document
						.querySelector<HTMLButtonElement>("#main-player .btnc-nxt")
						?.click();
				}}
			>
				<IconForward color="#FFFFFF" />
			</button>
			<button
				className="am-music-track-repeat"
				onClick={() => {
					if (currentPlayMode === PlayMode.Repeat) {
						switchPlayMode(PlayMode.Order);
						setCurrentPlayMode(PlayMode.Order);
					} else {
						switchPlayMode(PlayMode.Repeat);
						setCurrentPlayMode(PlayMode.Repeat);
					}
				}}
			>
				{currentPlayMode === PlayMode.Repeat ? (
					<IconRepeatOn color="#FFFFFF" />
				) : (
					<IconRepeat color="#FFFFFF" />
				)}
			</button>
		</div>
	);
};

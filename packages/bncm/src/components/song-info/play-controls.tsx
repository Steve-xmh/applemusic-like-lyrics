import { useAtom, useAtomValue } from "jotai";
import IconRewind from "../../assets/icon_rewind.svg";
import IconForward from "../../assets/icon_forward.svg";
import IconPause from "../../assets/icon_pause.svg";
import IconPlay from "../../assets/icon_play.svg";
import { PlayControlButton } from "./play-control-button";
import { musicContextAtom, playStatusAtom } from "../../music-context/wrapper";
import { PlayState } from "../../music-context";
import {
	leftControlButtonTypeAtom,
	rightControlButtonTypeAtom,
} from "../config/music";
import { FC } from "react";

export const PlayControls: FC = () => {
	const [playStatus, setPlayStatus] = useAtom(playStatusAtom);
	const musicCtx = useAtomValue(musicContextAtom);

	const leftControlBtn = useAtomValue(leftControlButtonTypeAtom);
	const rightControlBtn = useAtomValue(rightControlButtonTypeAtom);

	return (
		<div className="am-music-controls">
			<PlayControlButton type={leftControlBtn} />
			<button
				className="am-music-track-prev"
				onClick={() => {
					musicCtx?.rewindSong();
				}}
			>
				<IconRewind color="#FFFFFF" />
			</button>
			<button
				className="am-music-play"
				onClick={() => {
					if (playStatus === PlayState.Playing) {
						setPlayStatus(PlayState.Pausing);
					} else if (playStatus === PlayState.Pausing) {
						setPlayStatus(PlayState.Playing);
					}
				}}
			>
				{playStatus === PlayState.Playing ? (
					<IconPause color="#FFFFFF" />
				) : (
					<IconPlay color="#FFFFFF" />
				)}
			</button>
			<button
				className="am-music-track-next"
				onClick={() => {
					musicCtx?.forwardSong();
				}}
			>
				<IconForward color="#FFFFFF" />
			</button>
			<PlayControlButton type={rightControlBtn} />
		</div>
	);
};

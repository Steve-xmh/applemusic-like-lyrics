import { useAtomValue } from "jotai";
import { playStateAtom } from "../../core/states";

import IconPause from "../../assets/icon_pause.svg";
import IconRewind from "../../assets/icon_rewind.svg";
import IconForward from "../../assets/icon_forward.svg";
import IconPlay from "../../assets/icon_play.svg";
import { PlayState } from "../../api";
import { useConfigValue } from "../../api/react";
import {
	PlayControlButton,
	PlayControlButtonType,
} from "./play-control-button";

export const PlayControls: React.FC = () => {
	const playState = useAtomValue(playStateAtom);

	const leftControlBtn = useConfigValue(
		"leftControlBtn",
		PlayControlButtonType.PlaybackRandom,
	) as PlayControlButtonType;
	const rightControlBtn = useConfigValue(
		"rightControlBtn",
		PlayControlButtonType.PlaybackRepeat,
	) as PlayControlButtonType;

	return (
		<div className="am-music-controls">
			<PlayControlButton type={leftControlBtn} />
			<button
				className="am-music-track-prev"
				onClick={() => {
					document
						.querySelector<HTMLButtonElement>("#main-player .btnc-prv")
						?.click();
					document
						.querySelector<HTMLButtonElement>(
							"footer > * > * > .middle > *:nth-child(1) > button:nth-child(2)",
						)
						?.click();
				}}
			>
				<IconRewind color="#FFFFFF" />
			</button>
			<button
				className="am-music-play"
				onClick={() => {
					if (
						document.querySelector<HTMLButtonElement>("#main-player .btnp-play")
					) {
						document
							.querySelector<HTMLButtonElement>("#main-player .btnp-play")
							?.click();
					} else {
						document
							.querySelector<HTMLButtonElement>("#main-player .btnp-pause")
							?.click();
					}
					document
						.querySelector<HTMLButtonElement>(
							"footer > * > * > .middle > *:nth-child(1) > button:nth-child(3)",
						)
						?.click();
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
					document
						.querySelector<HTMLButtonElement>(
							"footer > * > * > .middle > *:nth-child(1) > button:nth-child(4)",
						)
						?.click();
				}}
			>
				<IconForward color="#FFFFFF" />
			</button>
			<PlayControlButton type={rightControlBtn} />
		</div>
	);
};

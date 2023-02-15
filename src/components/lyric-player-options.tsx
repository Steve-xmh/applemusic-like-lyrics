import { ActionIcon } from "@mantine/core";
import { IconLink } from "@tabler/icons";
import { useAtomValue } from "jotai";
import * as React from "react";
import { lyricEditorConnectedAtom } from "../core/states";

import IconQueue from "../assets/icon_queue.svg";

export const LyricPlayerOptions: React.FC = () => {
	const lyricEditorConnected = useAtomValue(lyricEditorConnectedAtom);
	// list f-vc f-cp
	// list f-vc f-cp z-show
	return (
		<div className="am-lyric-options">
			{lyricEditorConnected && (
				<ActionIcon radius="md" variant="transparent">
					<IconLink color="#00FF33" size={18} />
				</ActionIcon>
			)}
			<button
				className="am-music-track-queue"
				onClick={() => {
					requestIdleCallback(() => {
						document.querySelector<HTMLDivElement>(".list.f-vc.f-cp")?.click();
					});
				}}
			>
				<IconQueue color="#FFFFFF" />
			</button>
		</div>
	);
};

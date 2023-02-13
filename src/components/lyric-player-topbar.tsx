import { ActionIcon } from "@mantine/core";
import { IconDots, IconLink } from "@tabler/icons";
import { useAtomValue, useSetAtom } from "jotai";
import * as React from "react";
import { lyricEditorConnectedAtom, topbarMenuOpenedAtom } from "../core/states";

export const LyricPlayerTopBar: React.FC = () => {
	const setMenuOpened = useSetAtom(topbarMenuOpenedAtom);
	const lyricEditorConnected = useAtomValue(lyricEditorConnectedAtom);

	return (
		<div className="am-lyric-options">
			{lyricEditorConnected && (
				<ActionIcon radius="md" variant="transparent">
					<IconLink color="#00FF33" size={18} />
				</ActionIcon>
			)}
			<ActionIcon
				radius="md"
				onClick={() => setMenuOpened(true)}
				variant="transparent"
			>
				<IconDots color="#FFFFFF" size={18} />
			</ActionIcon>
		</div>
	);
};

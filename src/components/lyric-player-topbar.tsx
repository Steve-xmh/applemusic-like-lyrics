import { ActionIcon } from "@mantine/core";
import { IconDots } from "@tabler/icons";
import { useSetAtom } from "jotai";
import * as React from "react";
import { topbarMenuOpenedAtom } from "../core/states";

export const LyricPlayerTopBar: React.FC = () => {
	const setMenuOpened = useSetAtom(topbarMenuOpenedAtom);

	return (
		<div className="am-lyric-options">
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

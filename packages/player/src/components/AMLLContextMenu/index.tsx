import {
	hideLyricViewAtom,
	isLyricPageOpenedAtom,
} from "@applemusic-like-lyrics/react-full";
import { ContextMenu } from "@radix-ui/themes";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type { FC } from "react";
import { router } from "../../router";
import { musicIdAtom } from "../../states";

export const AMLLContextMenuContent: FC = () => {
	const [hideLyricView, setHideLyricView] = useAtom(hideLyricViewAtom);
	const setLyricPageOpened = useSetAtom(isLyricPageOpenedAtom);
	const musicId = useAtomValue(musicIdAtom);

	return (
		<ContextMenu.Content>
			<ContextMenu.CheckboxItem
				checked={!hideLyricView}
				onCheckedChange={(e) => setHideLyricView(!e)}
			>
				显示歌词
			</ContextMenu.CheckboxItem>
			<ContextMenu.Item
				onClick={() => {
					setLyricPageOpened(false);
					router.navigate(`/song/${musicId}`);
				}}
			>
				编辑歌曲覆盖信息
			</ContextMenu.Item>
		</ContextMenu.Content>
	);
};

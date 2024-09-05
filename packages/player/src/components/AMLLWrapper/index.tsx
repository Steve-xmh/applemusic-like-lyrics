import {
	PrebuiltLyricPlayer,
	hideLyricViewAtom,
	isLyricPageOpenedAtom,
} from "@applemusic-like-lyrics/react-full";
import { ContextMenu } from "@radix-ui/themes";
import classnames from "classnames";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { type FC, useLayoutEffect } from "react";
import { router } from "../../router";
import { musicIdAtom } from "../../states";
import styles from "./index.module.css";

const AMLLContextMenuContent: FC = () => {
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

export const AMLLWrapper: FC = () => {
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);

	useLayoutEffect(() => {
		if (isLyricPageOpened) {
			document.body.dataset.amllLyricsOpen = "";
		} else {
			delete document.body.dataset.amllLyricsOpen;
		}
	}, [isLyricPageOpened]);

	return (
		<ContextMenu.Root>
			<ContextMenu.Trigger>
				<PrebuiltLyricPlayer
					className={classnames(
						styles.lyricPage,
						isLyricPageOpened && styles.opened,
					)}
				/>
			</ContextMenu.Trigger>
			<AMLLContextMenuContent />
		</ContextMenu.Root>
	);
};

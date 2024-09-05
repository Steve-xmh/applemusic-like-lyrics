import {
	hideLyricViewAtom,
	isLyricPageOpenedAtom,
	PrebuiltLyricPlayer,
} from "@applemusic-like-lyrics/react-full";
import { useAtom, useAtomValue } from "jotai";
import styles from "./index.module.css";
import classnames from "classnames";
import { useLayoutEffect, type FC } from "react";
import { ContextMenu } from "@radix-ui/themes";

const AMLLContextMenuContent: FC = () => {
	const [hideLyricView, setHideLyricView] = useAtom(hideLyricViewAtom);

	return (
		<ContextMenu.Content>
			<ContextMenu.CheckboxItem
				checked={!hideLyricView}
				onCheckedChange={(e) => setHideLyricView(!e)}
			>
				显示歌词
			</ContextMenu.CheckboxItem>
			<ContextMenu.Item>编辑歌曲覆盖信息</ContextMenu.Item>
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

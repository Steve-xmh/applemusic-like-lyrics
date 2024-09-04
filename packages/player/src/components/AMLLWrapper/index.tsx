import {
	isLyricPageOpenedAtom,
	PrebuiltLyricPlayer,
} from "@applemusic-like-lyrics/react-full";
import { useAtomValue } from "jotai";
import styles from "./index.module.css";
import classnames from "classnames";
import { useLayoutEffect, type FC } from "react";

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
		<PrebuiltLyricPlayer
			className={classnames(
				styles.lyricPage,
				isLyricPageOpened && styles.opened,
			)}
		/>
	);
};

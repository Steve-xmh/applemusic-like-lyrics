import {
	MeshGradientRenderer,
	PixiRenderer,
} from "@applemusic-like-lyrics/core";
import {
	PrebuiltLyricPlayer,
	isLyricPageOpenedAtom,
	lyricBackgroundRendererAtom,
} from "@applemusic-like-lyrics/react-full";
import { ContextMenu } from "@radix-ui/themes";
import classnames from "classnames";
import { useAtomValue, useSetAtom } from "jotai";
import { type FC, useLayoutEffect } from "react";
import { backgroundRendererAtom } from "../../states";
import { AMLLContextMenuContent } from "../AMLLContextMenu";
import styles from "./index.module.css";

export const AMLLWrapper: FC = () => {
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);
	const backgroundRenderer = useAtomValue(backgroundRendererAtom);
	const setBackgroundRenderer = useSetAtom(lyricBackgroundRendererAtom);

	useLayoutEffect(() => {
		if (isLyricPageOpened) {
			document.body.dataset.amllLyricsOpen = "";
		} else {
			delete document.body.dataset.amllLyricsOpen;
		}
	}, [isLyricPageOpened]);

	useLayoutEffect(() => {
		switch (backgroundRenderer) {
			case "pixi":
				setBackgroundRenderer({
					renderer: PixiRenderer,
				});
				break;
			default:
				setBackgroundRenderer({
					renderer: MeshGradientRenderer,
				});
				break;
		}
	}, [backgroundRenderer, setBackgroundRenderer]);

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

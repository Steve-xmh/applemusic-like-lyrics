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
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { type FC, useLayoutEffect } from "react";
import { amllMenuOpenedAtom, backgroundRendererAtom } from "../../states";
import { AMLLContextMenuContent } from "../AMLLContextMenu";
import styles from "./index.module.css";

export const AMLLWrapper: FC = () => {
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);
	const backgroundRenderer = useAtomValue(backgroundRendererAtom);
	const [amllMenuOpened, setAmllMenuOpened] = useAtom(amllMenuOpenedAtom);
	const setBackgroundRenderer = useSetAtom(lyricBackgroundRendererAtom);

	useLayoutEffect(() => {
		if (isLyricPageOpened) {
			document.body.dataset.amllLyricsOpen = "";
			setSystemTitlebarImmersiveMode(true);
		} else {
			delete document.body.dataset.amllLyricsOpen;
			setSystemTitlebarImmersiveMode(false);
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

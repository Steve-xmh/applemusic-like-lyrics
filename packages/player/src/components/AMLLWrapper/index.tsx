import {
	CanvasLyricPlayer,
	DomLyricPlayer,
	LyricPlayer,
	MeshGradientRenderer,
	PixiRenderer,
} from "@applemusic-like-lyrics/core";
import {
	PrebuiltLyricPlayer,
	isLyricPageOpenedAtom,
	lyricBackgroundRendererAtom,
	lyricPlayerImplementationAtom as lyricPlayerImplementationConstructorAtom,
} from "@applemusic-like-lyrics/react-full";
import { ContextMenu } from "@radix-ui/themes";
import classnames from "classnames";
import { useAtomValue, useSetAtom } from "jotai";
import { type FC, useLayoutEffect } from "react";
import {
	LyricPlayerImplementation,
	backgroundRendererAtom,
	lyricPlayerImplementationAtom,
} from "../../states";
import { AMLLContextMenuContent } from "../AMLLContextMenu";
import styles from "./index.module.css";

export const AMLLWrapper: FC = () => {
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);
	const backgroundRenderer = useAtomValue(backgroundRendererAtom);
	const lyricPlayerImplementation = useAtomValue(lyricPlayerImplementationAtom);
	const setBackgroundRenderer = useSetAtom(lyricBackgroundRendererAtom);
	const setLyricPlayerImplementation = useSetAtom(
		lyricPlayerImplementationConstructorAtom,
	);

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

	useLayoutEffect(() => {
		switch (lyricPlayerImplementation) {
			case LyricPlayerImplementation.Dom:
				setLyricPlayerImplementation({
					lyricPlayer: DomLyricPlayer,
				});
				break;
			case LyricPlayerImplementation.Canvas:
				setLyricPlayerImplementation({
					lyricPlayer: CanvasLyricPlayer,
				});
				break;
			default:
				setLyricPlayerImplementation({
					lyricPlayer: LyricPlayer,
				});
				break;
		}
	}, [lyricPlayerImplementation, setLyricPlayerImplementation]);

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

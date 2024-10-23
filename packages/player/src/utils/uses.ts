import { useSetAtom } from "jotai";
import { useLayoutEffect } from "react";
import { hideNowPlayingBarAtom } from "../states/index.ts";

export const useHideNowPlayingBar = () => {
	const setHideNowPlayingBar = useSetAtom(hideNowPlayingBarAtom);
	useLayoutEffect(() => {
		setHideNowPlayingBar(true);
		return () => {
			setHideNowPlayingBar(false);
		};
	}, [setHideNowPlayingBar]);
};

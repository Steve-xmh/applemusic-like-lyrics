import {
	type Callback,
	onPlayOrResumeAtom,
	onRequestNextSongAtom,
	onRequestPrevSongAtom,
} from "@applemusic-like-lyrics/react-full";
import {
	type ShortcutEvent,
	register,
	unregister,
} from "@tauri-apps/plugin-global-shortcut";
import type { Atom } from "jotai";
import { useAtomValue } from "jotai";
import { type FC, useEffect } from "react";

const useShotcut = (shotcut: string, callback?: () => void) => {
	useEffect(() => {
		if (!callback) return;
		register(shotcut, (evt: ShortcutEvent) => {
			if (evt.state === "Pressed") {
				callback();
			}
		});
		return () => {
			unregister(shotcut);
		};
	}, [shotcut, callback]);
};

const useShotcutAtom = (
	shotcut: string,
	callbackAtom: Atom<Callback<[], void>>,
) => {
	const callback = useAtomValue(callbackAtom).onEmit;

	useShotcut(shotcut, callback);
};

export const ShotcutContext: FC = () => {
	useShotcutAtom("CmdOrCtrl+Alt+P", onPlayOrResumeAtom);
	useShotcutAtom("CmdOrCtrl+Alt+ArrowRight", onRequestNextSongAtom);
	useShotcutAtom("CmdOrCtrl+Alt+ArrowLeft", onRequestPrevSongAtom);

	return null;
};

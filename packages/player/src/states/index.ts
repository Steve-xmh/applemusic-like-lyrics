import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const musicIdAtom = atom("");

export const backgroundRendererAtom = atomWithStorage(
	"amll-player.backgroundRenderer",
	"mesh",
);

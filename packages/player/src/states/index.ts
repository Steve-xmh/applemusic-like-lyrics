import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const musicIdAtom = atom("");

export const backgroundRendererAtom = atomWithStorage(
	"amll-player.backgroundRenderer",
	"mesh",
);

export const fftDataRangeAtom = atomWithStorage(
	"amll-player.fftDataRange",
	[80, 2000],
);

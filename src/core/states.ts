import { atom } from "jotai";
import { getPlayingSong, LyricFile, PlayState } from "../api";
import { LyricLine } from "./lyric-parser";

export const isLyricPageOpeningAtom = atom(false);
export const currentAudioIdAtom = atom("");
export const currentAudioDurationAtom = atom(0);
export const currentRawLyricRespAtom = atom<LyricFile>({});
export const playStateAtom = atom(PlayState.Pausing);
export const currentLyricsAtom = atom<LyricLine[] | null>(null);
export const currentLyricsIndexAtom = atom(-1);
export const playingSongDataAtom = atom(getPlayingSong());
export const musicIdAtom = atom<string | number>((get) => {
	const playing = get(playingSongDataAtom);
	return (
		playing?.originFromTrack?.lrcid ||
		playing?.originFromTrack?.track?.tid ||
		playing?.data?.id ||
		0
	);
});
export const albumAtom = atom(
	(get) => get(playingSongDataAtom)?.data?.album || {},
);
export const songNameAtom = atom(
	(get) => get(playingSongDataAtom)?.data?.name || "未知歌名",
);
export const songAliasNameAtom = atom(
	(get) => get(playingSongDataAtom)?.data?.alias || [],
);
export const songArtistsAtom = atom(
	(get) => get(playingSongDataAtom)?.data?.artists || [],
);
export const getMusicId = (): number | string =>
	getPlayingSong()?.originFromTrack?.lrcid ||
	getPlayingSong()?.originFromTrack?.track?.tid ||
	getPlayingSong()?.data?.id ||
	0;

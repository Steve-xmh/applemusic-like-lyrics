import { atom } from "jotai";
import { getPlayingSong, PlayState } from "../api";
import { LyricLine } from "./lyric-parser";

export const isLyricPageOpening = atom(false);
export const currentAudioId = atom("");
export const currentAudioDuration = atom(0);
export const playState = atom(PlayState.Pausing);
export const currentLyrics = atom<LyricLine[] | null>(null);
export const getMusicId = (): number | string =>
	getPlayingSong()?.originFromTrack?.lrcid ||
	getPlayingSong()?.originFromTrack?.track?.tid ||
	getPlayingSong()?.data?.id ||
	0;

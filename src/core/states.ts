import { Atom, atom } from "jotai";
import { selectAtom } from "jotai/utils";
import { AudioQualityType, getPlayingSong, LyricFile, PlayState } from "../api";
import { Pixel } from "../libs/color-quantize/utils";
import { getCurrentPlayMode, PlayMode } from "../utils";
import { LyricLine } from "./lyric-parser";

export const windowedConfigOpenedAtom = atom(false);
export const topbarMenuOpenedAtom = atom(false);
export const isLyricPageOpeningAtom = atom(false);
export const lyricEditorConnectedAtom = atom(false);
export const currentAudioIdAtom = atom("");
export const currentAudioDurationAtom = atom(0);
export const currentRawLyricRespAtom = atom<LyricFile>({});
export const ttmlLyricAtom = atom<LyricLine[] | null>(null);
export const currentAudioQualityTypeAtom = atom(AudioQualityType.Normal);
export const playStateAtom = atom(PlayState.Pausing);
export const currentPlayModeAtom = atom(getCurrentPlayMode() || PlayMode.One);
export const currentLyricsAtom = atom<LyricLine[] | null>(null);
export const currentLyricsIndexesAtom = atom(new Set<number>());
export const playingSongDataAtom = atom(getPlayingSong());
export const albumImageUrlAtom = atom<string | null>(null);
export const albumImageMainColorsAtom = atom<Pixel[]>([[0, 0, 0]]);
export const rightClickedLyricAtom = atom<LyricLine | null>(null);
export const playProgressAtom = atom(0);
export const playVolumeAtom = atom(0);
export const lyricForceReloadAtom = atom(Symbol("lyric-force-reload-atom"));
export const lyricErrorAtom = atom<Error | null>(null);

export const musicIdAtom: Atom<string | number> = selectAtom(
	playingSongDataAtom,
	(playing) => {
		return (
			playing?.originFromTrack?.lrcid ||
			playing?.originFromTrack?.track?.tid ||
			playing?.data?.id ||
			0
		);
	},
);

export const lyricOffsetAtom = atom(
	(get) => {
		return get(currentRawLyricRespAtom).lyricOffset || 0;
	},
	(_get, set, newValue: number | undefined) => {
		set(currentRawLyricRespAtom, (res) => ({
			...res,
			lyricOffset: newValue,
		}));
	},
);

export const albumAtom = selectAtom(
	playingSongDataAtom,
	(playing) => playing?.data?.album || {},
);
export const songNameAtom = selectAtom(
	playingSongDataAtom,
	(playing) => playing?.data?.name || "未知歌名",
);
export const songAliasNameAtom = selectAtom(
	playingSongDataAtom,
	(playing) => playing?.data?.alias || [],
);
export const songArtistsAtom = selectAtom(
	playingSongDataAtom,
	(playing): { name: string; id: number | string }[] =>
		playing?.data?.artists || [],
);
export const getMusicId = (): number | string =>
	getPlayingSong()?.originFromTrack?.lrcid ||
	getPlayingSong()?.originFromTrack?.track?.tid ||
	getPlayingSong()?.data?.id ||
	0;

export const selectMusicIdModalOpenedAtom = atom(false);
export const selectInternetLyricModalOpenedAtom = atom(false);
export const selectLocalLyricModalOpenedAtom = atom(false);
export const adjustLyricOffsetModalOpenedAtom = atom(false);

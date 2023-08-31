import { type FC, useEffect, useRef } from "react";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import {
	Artist,
	AudioQualityType,
	MusicContextBase,
	PlayMode,
	PlayState,
} from ".";
import { isNCMV3 } from "../utils/is-ncm-v3";
import { MusicContextV2 } from "./v2";

export const musicIdAtom = atom("0");
export const musicNameAtom = atom("未知歌名");
export const musicArtistsAtom = atom<Artist[]>([
	{
		id: "0",
		name: "未知作者",
	},
]);
export const musicCoverAtom = atom("");
export const musicAlbumIdAtom = atom("0");
export const musicAlbumNameAtom = atom("未知专辑");
export const musicDurationAtom = atom(0);
export const musicQualityAtom = atom(AudioQualityType.Normal);
export const playModeAtom = atom(
	(get) => get(rawPlayModeAtom),
	(get, set, update: PlayMode) => {
		const musicCtx = get(rawMusicContextAtom);
		musicCtx?.setPlayMode(update);
		const mode = musicCtx?.getPlayMode();
		if (mode) set(rawPlayModeAtom, mode);
	},
);
const rawPlayModeAtom = atom(PlayMode.One);
export const playStatusAtom = atom(
	(get) => get(rawPlayStatusAtom),
	(get, _set, update: PlayState) => {
		const musicCtx = get(rawMusicContextAtom);
		if (update === PlayState.Playing) {
			musicCtx?.resume();
		} else if (update === PlayState.Pausing) {
			musicCtx?.pause();
		}
	},
);
const rawPlayStatusAtom = atom(PlayState.Pausing);
export const currentTimeAtom = atom(
	(get) => get(rawCurrentTimeAtom),
	(
		get,
		set,
		update:
			| number
			| {
					raw: number;
			  },
	) => {
		const musicCtx = get(rawMusicContextAtom);
		if (typeof update === "number") musicCtx?.seekToPosition(update);
		else set(rawCurrentTimeAtom, update.raw);
	},
);
const rawCurrentTimeAtom = atom(0);
export const rawCurrentVolumeAtom = atom(0.5);
export const currentVolumeAtom = atom(
	(get) => get(rawCurrentVolumeAtom),
	(get, _set, update: number) => {
		const musicCtx = get(rawMusicContextAtom);
		musicCtx?.setVolume(update);
	},
);
export const lyricPageOpenedAtom = atom(false);
export const musicContextAtom = atom((get) => get(rawMusicContextAtom));
const rawMusicContextAtom = atom<MusicContextBase | undefined>(undefined);
export const setClipboardAtom = atom(null, async (get, _set, data: string) => {
	const musicCtx = get(rawMusicContextAtom);
	await musicCtx?.setClipboard(data);
});

export const MusicInfoWrapper: FC = () => {
	const musicCtx = useRef<MusicContextBase>();
	const [lyricPageOpened, setLyricPageOpened] = useAtom(lyricPageOpenedAtom);
	const setMusicId = useSetAtom(musicIdAtom);
	const setMusicName = useSetAtom(musicNameAtom);
	const setMusicArtists = useSetAtom(musicArtistsAtom);
	const setMusicCover = useSetAtom(musicCoverAtom);
	const setMusicAlbumId = useSetAtom(musicAlbumIdAtom);
	const setMusicAlbumName = useSetAtom(musicAlbumNameAtom);
	const setCurrentTime = useSetAtom(rawCurrentTimeAtom);
	const setPlayStatus = useSetAtom(rawPlayStatusAtom);
	const setVolume = useSetAtom(rawCurrentVolumeAtom);
	const setMusicContext = useSetAtom(rawMusicContextAtom);
	const setMusicDuration = useSetAtom(musicDurationAtom);
	const setMusicQuality = useSetAtom(musicQualityAtom);
	const setCurrentPlayMode = useSetAtom(rawPlayModeAtom);

	useEffect(() => {
		if (location.hostname === "localhost") return;
		if (isNCMV3()) {
			// TODO: 制作 NCM v3 接口
		} else {
			musicCtx.current = new MusicContextV2();
		}
		if (musicCtx.current) {
			musicCtx.current.addEventListener(
				"load",
				function (this: MusicContextBase) {
					setMusicId(this.getMusicId());
					setMusicName(this.getMusicName());
					setMusicDuration(this.getMusicDuration());
					setMusicQuality(this.getMusicQuality());
					setPlayStatus(this.getPlayState());
					setMusicAlbumId(this.getMusicAlbumId());
					setMusicAlbumName(this.getMusicAlbumName());
					setMusicArtists(this.getMusicArtists().map((v) => ({ ...v })));
				},
			);
			musicCtx.current.addEventListener(
				"pause",
				function (this: MusicContextBase) {
					setPlayStatus(PlayState.Pausing);
				},
			);
			musicCtx.current.addEventListener(
				"resume",
				function (this: MusicContextBase) {
					setPlayStatus(PlayState.Playing);
				},
			);
			musicCtx.current.addEventListener(
				"album-updated",
				function (this: MusicContextBase) {
					setMusicCover(this.getMusicCoverImage());
				},
			);
			musicCtx.current.addEventListener(
				"progress",
				function (this: MusicContextBase, evt) {
					setCurrentTime(evt.detail.progress);
				},
			);
			musicCtx.current.addEventListener(
				"volume",
				function (this: MusicContextBase, evt) {
					setVolume(evt.detail.volume);
				},
			);
			setPlayStatus(musicCtx.current.getPlayState());
		}
		const onPageOpened = () => setLyricPageOpened(true);
		const onPageClosed = () => setLyricPageOpened(false);

		window.addEventListener("amll-lyric-page-opened", onPageOpened);
		window.addEventListener("amll-lyric-page-closed", onPageClosed);
		setMusicContext(musicCtx.current);

		return () => {
			musicCtx.current?.dispose();
			window.removeEventListener("amll-lyric-page-opened", onPageOpened);
			window.removeEventListener("amll-lyric-page-closed", onPageClosed);
		};
	}, []);

	useEffect(() => {
		if (musicCtx.current) {
			setCurrentPlayMode(musicCtx.current.getPlayMode());
		}
	}, [lyricPageOpened]);

	return null;
};

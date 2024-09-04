import { type FC, useEffect, useRef } from "react";
import { atom, useAtom, useAtomValue, useSetAtom, useStore } from "jotai";
import {
	Artist,
	AudioQualityType,
	MusicContextBase,
	PlayMode,
	PlayState,
} from ".";
import { isNCMV3 } from "../utils/is-ncm-v3";
import { MusicContextV2 } from "./v2";
import { MusicContextV3 } from "./v3";
import { normalizePath } from "../utils/path";
import { warn } from "../utils/logger";
import { loadable } from "jotai/utils";
import {
	pauseWhenMusicLoadedAtom,
	usePlayPositionLerpAtom,
} from "../components/config/atoms";

export const musicIdAtom = atom("0");
export const musicNameAtom = atom("未知歌名");
export const displayMusicNameAtom = atom((get) => {
	const overrideData = get(loadableMusicOverrideDataAtom);
	if (overrideData.state === "hasData") {
		return overrideData.data.musicName || get(musicNameAtom);
	} else {
		return get(musicNameAtom);
	}
});
export const musicArtistsAtom = atom<Artist[]>([
	{
		id: "0",
		name: "未知作者",
	},
]);
export const displayMusicArtistsAtom = atom((get) => {
	const overrideData = get(loadableMusicOverrideDataAtom);
	if (overrideData.state === "hasData") {
		return overrideData.data.musicArtists
			? ([
					{
						id: "0",
						name: overrideData.data.musicArtists,
					},
				] as Artist[])
			: get(musicArtistsAtom);
	}
	return get(musicArtistsAtom);
});
export const musicCoverAtom = atom("");
export const displayMusicCoverAtom = atom((get) => {
	const overrideData = get(loadableMusicOverrideDataAtom);
	if (overrideData.state === "hasData") {
		return overrideData.data.musicCoverUrl || get(musicCoverAtom);
	}
	return get(musicCoverAtom);
});

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
export const rawPlayModeAtom = atom(PlayMode.One);
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
export const rawPlayStatusAtom = atom(PlayState.Pausing);
export const isSeekingAtom = atom(false);
export const seekingAtom = atom(
	(get) => get(isSeekingAtom),
	(get, set, update: boolean | { raw: boolean }) => {
		if (typeof update === "boolean") {
			set(isSeekingAtom, update);
		} else {
			set(isSeekingAtom, update.raw);
		}
	},
);

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
		if (typeof update === "number") {
			musicCtx?.seekToPosition(update);
		} else {
			set(rawCurrentTimeAtom, update.raw);
		}
	},
);
export const rawCurrentTimeAtom = atom(0);
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
export const rawMusicContextAtom = atom<MusicContextBase | undefined>(
	undefined,
);
export const setClipboardAtom = atom(null, async (get, _set, data: string) => {
	const musicCtx = get(rawMusicContextAtom);
	await musicCtx?.setClipboard(data);
});

export enum LyricOverrideType {
	None = "none",
	MusicId = "id",
	PureMusic = "pure-music",
	LocalLRC = "local-lrc",
	LocalYRC = "local-yrc",
	LocalQRC = "local-qrc",
	LocalTTML = "local-ttml",
}

export interface MusicOverrideData {
	musicName: string;
	musicArtists: string;
	musicCoverUrl: string;
	musicCoverIsVideo: boolean;
	lyricOffset: number;
	lyricOverrideType: LyricOverrideType;
	lyricOverrideMusicId: string;
	lyricOverrideOriginalLyricData: string;
	lyricOverrideTranslatedLyricData: string;
	lyricOverrideRomanLyricData: string;
}

const musicOverrideDataUpdateAtom = atom(Symbol("music-override-data-update"));
export const newOverrideData = (): MusicOverrideData => ({
	musicName: "",
	musicArtists: "",
	musicCoverUrl: "",
	musicCoverIsVideo: false,
	lyricOffset: 0,
	lyricOverrideType: LyricOverrideType.None,
	lyricOverrideMusicId: "",
	lyricOverrideOriginalLyricData: "",
	lyricOverrideTranslatedLyricData: "",
	lyricOverrideRomanLyricData: "",
});

export const patchMusicOverrideDataAtom = atom(
	null,
	async (get, set, id: string, overrideData: Partial<MusicOverrideData>) => {
		get(musicOverrideDataUpdateAtom);
		const ctx = get(rawMusicContextAtom);
		let curData: Partial<MusicOverrideData> = {};

		if (ctx) {
			const overrideDirPath = normalizePath(
				`${ctx.getDataDir()}/music-override-data`,
			);
			const overrideJsonPath = normalizePath(`${overrideDirPath}/${id}.json`);
			try {
				if (await ctx.isFileExists(overrideJsonPath)) {
					const overrideJson = JSON.parse(
						await ctx.readFileText(overrideJsonPath),
					);
					curData = overrideJson;
					if (typeof curData !== "object") curData = {};
				}
			} catch (err) {
				warn("加载音乐覆盖信息出错", id, overrideJsonPath, err);
			}
			const modifiedData = Object.assign(curData, overrideData);
			if (!(await ctx.isFileExists(overrideDirPath))) {
				await ctx.makeDirectory(overrideDirPath);
			}
			if (Object.keys(modifiedData).length === 0) {
				await ctx.deleteFile(overrideJsonPath);
				set(musicOverrideDataUpdateAtom, Symbol("music-override-data-update"));
			} else {
				try {
					await ctx.writeFileText(
						overrideJsonPath,
						JSON.stringify(modifiedData),
					);
					set(
						musicOverrideDataUpdateAtom,
						Symbol("music-override-data-update"),
					);
				} catch (err) {
					warn("保存音乐覆盖信息出错", id, overrideJsonPath, err);
				}
			}
		}
	},
);

export const musicOverrideDataAtom = atom(
	async (get) => {
		get(musicOverrideDataUpdateAtom);
		const id = get(musicIdAtom);
		const ctx = get(rawMusicContextAtom);
		let data: Partial<MusicOverrideData> = {};

		if (ctx) {
			const overrideJsonPath = normalizePath(
				`${ctx.getDataDir()}/music-override-data/${id}.json`,
			);
			try {
				if (await ctx.isFileExists(overrideJsonPath)) {
					const overrideJson = JSON.parse(
						await ctx.readFileText(overrideJsonPath),
					);
					data = overrideJson;
					if (typeof data !== "object") data = {};
				}
			} catch (err) {
				warn("加载音乐覆盖信息出错", id, overrideJsonPath, err);
			}
		}

		return data;
	},
	async (get, set, data: Partial<MusicOverrideData>) => {
		const id = get(musicIdAtom);
		const ctx = get(rawMusicContextAtom);
		if (ctx) {
			const overrideDirPath = normalizePath(
				`${ctx.getDataDir()}/music-override-data`,
			);
			const overrideJsonPath = normalizePath(`${overrideDirPath}/${id}.json`);
			if (!(await ctx.isFileExists(overrideDirPath))) {
				await ctx.makeDirectory(overrideDirPath);
			}
			if (Object.keys(data).length === 0) {
				await ctx.deleteFile(overrideJsonPath);
				set(musicOverrideDataUpdateAtom, Symbol("music-override-data-update"));
			} else {
				try {
					await ctx.writeFileText(overrideJsonPath, JSON.stringify(data));
					set(
						musicOverrideDataUpdateAtom,
						Symbol("music-override-data-update"),
					);
				} catch (err) {
					warn("保存音乐覆盖信息出错", id, overrideJsonPath, err);
				}
			}
		}
	},
);
export const loadableMusicOverrideDataAtom = loadable(musicOverrideDataAtom);

export const MusicInfoWrapper: FC = () => {
	const musicCtx = useRef<MusicContextBase>();
	const [lyricPageOpened, setLyricPageOpened] = useAtom(lyricPageOpenedAtom);
	const usePlayPositionLerp = useAtomValue(usePlayPositionLerpAtom);
	const store = useStore();
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
		if (plugin.musicStatus) {
			musicCtx.current = plugin.musicStatus;
		} else if (isNCMV3()) {
			musicCtx.current = new MusicContextV3();
		} else {
			musicCtx.current = new MusicContextV2();
		}
		if (musicCtx.current) {
			plugin.musicStatus = musicCtx.current;
			musicCtx.current.addEventListener(
				"load",
				function (this: MusicContextBase) {
					if (store.get(pauseWhenMusicLoadedAtom)) {
						musicCtx.current?.pause();
					}
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
	}, [lyricPageOpened, musicCtx.current]);

	useEffect(() => {
		if (musicCtx.current) {
			musicCtx.current.setPlayPositionLerp(usePlayPositionLerp);
		}
	}, [usePlayPositionLerp, musicCtx.current]);

	return null;
};

import {type FC, useEffect, useRef} from "react";
import {atom, useSetAtom} from "jotai";
import {Artist, AudioQualityType, MusicContextBase, PlayMode, PlayState} from ".";
import {isNCMV3} from "../utils/is-ncm-v3";
import {MusicContextV2} from "./v2";

export const musicIdAtom = atom("");
export const musicNameAtom = atom("");
export const musicArtistsAtom = atom<Artist[]>([]);
export const musicCoverAtom = atom("");
export const musicDurationAtom = atom(0);
export const musicQualityAtom = atom(AudioQualityType.Normal);
export const playModeAtom = atom((get) => get(rawPlayModeAtom), (get, _set, update: PlayMode) => {
    const musicCtx = get(musicContextAtom);
});
const rawPlayModeAtom = atom(PlayMode.One);
export const playStatusAtom = atom((get) => get(rawPlayStatusAtom), (get, _set, update: PlayState) => {
    const musicCtx = get(musicContextAtom);
    if (update === PlayState.Playing) {
        musicCtx?.resume();
    } else if (update === PlayState.Pausing) {
        musicCtx?.pause();
    }
});
const rawPlayStatusAtom = atom(PlayState.Pausing);
export const currentTimeAtom = atom((get) => get(rawCurrentTimeAtom), (get, set, update: number | {
    raw: number
}) => {
    const musicCtx = get(musicContextAtom);
    if (typeof update === "number")
        musicCtx?.seekToPosition(update);
    else
        set(rawCurrentTimeAtom, update.raw);
});
const rawCurrentTimeAtom = atom(0);
export const currentVolumeAtom = atom(0.5, (get, _set, update: number) => {
    const musicCtx = get(musicContextAtom);
    musicCtx?.setVolume(update);
});
export const lyricPageOpenedAtom = atom(false);

const musicContextAtom = atom<MusicContextBase | undefined>(undefined);

export const MusicInfoWrapper: FC = () => {
	const musicCtx = useRef<MusicContextBase>();
	const setMusicId = useSetAtom(musicIdAtom);
	const setMusicName = useSetAtom(musicNameAtom);
	const setMusicArtists = useSetAtom(musicArtistsAtom);
	const setMusicCover = useSetAtom(musicCoverAtom);
	const setCurrentTime = useSetAtom(rawCurrentTimeAtom);
	const setLyricPageOpened = useSetAtom(lyricPageOpenedAtom);
	const setPlayStatus = useSetAtom(rawPlayStatusAtom);
	const setVolume = useSetAtom(currentVolumeAtom);
    const setMusicContext = useSetAtom(musicContextAtom);
    const setMusicDuration = useSetAtom(musicDurationAtom);
    const setMusicQuality = useSetAtom(musicQualityAtom);

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
                    setMusicArtists(this.getMusicArtists().map((v) => ({ ...v })));
                },
            );
            musicCtx.current.addEventListener(
                "pause",
                function (this: MusicContextBase) {
                    setPlayStatus(PlayState.Pausing);
                },
            )
            musicCtx.current.addEventListener(
                "resume",
                function (this: MusicContextBase) {
                    setPlayStatus(PlayState.Playing);
                },
            )
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
            musicCtx.current.addEventListener("volume", function (this: MusicContextBase, evt) {
                setVolume(evt.detail.volume);
            });
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

	return <></>;
};

import { type FC, useEffect, useRef } from "react";
import { atom, useSetAtom } from "jotai";
import { Artist, MusicStatusGetterBase } from ".";
import { isNCMV3 } from "../utils/is-ncm-v3";
import { MusicStatusGetterV2 } from "./v2";
import { MusicStatusGetterDev } from "./dev";

export const musicIdAtom = atom("");
export const musicNameAtom = atom("");
export const musicArtistsAtom = atom<Artist[]>([]);
export const musicCoverAtom = atom("");
export const currentTimeAtom = atom(0);
export const lyricPageOpenedAtom = atom(false);

export const MusicInfoWrapper: FC = () => {
	const musicInfoGetter = useRef<MusicStatusGetterBase>();
	const setMusicId = useSetAtom(musicIdAtom);
	const setMusicName = useSetAtom(musicNameAtom);
	const setMusicArtists = useSetAtom(musicArtistsAtom);
	const setMusicCover = useSetAtom(musicCoverAtom);
	const setCurrentTime = useSetAtom(currentTimeAtom);
	const setLyricPageOpened = useSetAtom(lyricPageOpenedAtom);

	useEffect(() => {
		if (location.hostname === "localhost") return;
		if (isNCMV3()) {
			// TODO: 制作 NCM v3 接口
		} else {
			musicInfoGetter.current = new MusicStatusGetterV2();
		}
		musicInfoGetter.current?.addEventListener(
			"load",
			function (this: MusicStatusGetterBase) {
				setMusicId(this.getMusicId());
				setMusicName(this.getMusicName());
				setMusicArtists(this.getMusicArtists().map((v) => ({ ...v })));
			},
		);
		musicInfoGetter.current?.addEventListener(
			"album-updated",
			function (this: MusicStatusGetterBase) {
				setMusicCover(this.getMusicCoverImage());
			},
		);
		musicInfoGetter.current?.addEventListener(
			"progress",
			function (this: MusicStatusGetterBase, evt) {
				setCurrentTime(evt.detail.progress);
			},
		);
		const onPageOpened = () => setLyricPageOpened(true);
		const onPageClosed = () => setLyricPageOpened(false);

		window.addEventListener("amll-lyric-page-opened", onPageOpened);
		window.addEventListener("amll-lyric-page-closed", onPageClosed);

		return () => {
			musicInfoGetter.current?.dispose();
			window.removeEventListener("amll-lyric-page-opened", onPageOpened);
			window.removeEventListener("amll-lyric-page-closed", onPageClosed);
		};
	}, []);

	return <></>;
};

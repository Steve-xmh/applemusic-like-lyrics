import { FC, useEffect, useRef } from "react";
import { atom, useSetAtom } from "jotai";
import { MusicStatusGetterBase } from ".";
import { isNCMV3 } from "../utils/is-ncm-v3";
import { MusicStatusGetterV2 } from "./v2";

export const musicIdAtom = atom("");
export const musicNameAtom = atom("");
export const musicCoverAtom = atom("");
export const currentTimeAtom = atom(0);

export const MusicInfoWrapper: FC = () => {
	const musicInfoGetter = useRef<MusicStatusGetterBase>();
	const setMusicId = useSetAtom(musicIdAtom);
	const setMusicName = useSetAtom(musicNameAtom);
	const setMusicCover = useSetAtom(musicCoverAtom);
	const setCurrentTime = useSetAtom(currentTimeAtom);

	useEffect(() => {
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
		return () => {
			musicInfoGetter.current?.dispose();
		};
	}, []);

	return <></>;
};

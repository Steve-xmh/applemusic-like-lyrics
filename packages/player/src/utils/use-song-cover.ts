import { useEffect, useMemo } from "react";
import type { Song } from "../dexie";

export const useSongCover = (song?: Song) => {
	const songImgUrl = useMemo(
		() => (song?.cover ? URL.createObjectURL(song.cover) : ""),
		[song],
	);
	useEffect(() => {
		return () => {
			if (songImgUrl.length > 0) URL.revokeObjectURL(songImgUrl);
		};
	}, [songImgUrl]);
	return songImgUrl;
};

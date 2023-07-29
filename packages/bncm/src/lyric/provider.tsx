import { atom, useAtomValue, useSetAtom } from "jotai";
import { FC, useEffect } from "react";
import { musicIdAtom } from "../info/wrapper";
import { LyricLine } from "@applemusic-like-lyrics/core";

interface EAPILyric {
	version: number;
	lyric: string;
}

// rome-ignore lint/correctness/noUnusedVariables: <explanation>
interface EAPILyricResponse extends EAPIResponse {
	lrc?: EAPILyric;
	tlyric?: EAPILyric;
	romalrc?: EAPILyric;
	yromalrc?: EAPILyric;
	ytlrc?: EAPILyric;
}

/**
 * 根据歌曲 ID 获取歌词数据信息
 * @param songId 歌曲ID
 * @returns 歌词数据信息
 */
async function getLyric(songId: string): Promise<EAPILyricResponse> {
	const v = await fetch(
		`${APP_CONF.domain}/api/song/lyric/v1?tv=0&lv=0&rv=0&kv=0&yv=0&ytv=0&yrv=0&cp=false&id=${songId}`,
	);
	return await v.json();
}

export const lyricLinesAtom = atom<LyricLine[] | undefined>(undefined);

export const LyricProvider: FC = () => {
	const musicId = useAtomValue(musicIdAtom);
	const setLyricLines = useSetAtom(lyricLinesAtom);

	useEffect(() => {
		let canceled = false;
		setLyricLines(undefined);

		(async () => {
			await getLyric(songId);
		})();

		return () => {
			canceled = true;
		};
	}, [musicId]);

	return <></>;
};

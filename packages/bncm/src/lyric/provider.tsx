import { atom, useAtomValue, useSetAtom } from "jotai";
import { FC, useEffect } from "react";
import { musicIdAtom } from "../info/wrapper";
import { LyricLine as CoreLyricLine } from "@applemusic-like-lyrics/core";
import {
	parseLrc,
	parseYrc,
	type LyricLine,
} from "@applemusic-like-lyrics/lyric";
import { log, warn } from "../utils/logger";

interface EAPILyric {
	version: number;
	lyric: string;
}

interface EAPILyricResponse extends EAPIResponse {
	lrc?: EAPILyric;
	tlyric?: EAPILyric;
	romalrc?: EAPILyric;
	yrc?: EAPILyric;
	ytlrc?: EAPILyric;
	yromalrc?: EAPILyric;
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
	if (v.ok) return await v.json();
	else throw v.statusText;
}

export const lyricLinesAtom = atom<CoreLyricLine[] | undefined>(undefined);

const transformDynamicLyricLine = (
	line: LyricLine,
	i: number,
	lines: LyricLine[],
): CoreLyricLine => ({
	words: line.words,
	startTime: line.words[0]?.startTime ?? 0,
	endTime: line.words[line.words.length - 1]?.endTime ?? Infinity,
	translatedLyric: "",
	romanLyric: "",
	isBG: false,
	isDuet: false,
});

const transformLyricLine = (
	line: LyricLine,
	i: number,
	lines: LyricLine[],
): CoreLyricLine => ({
	words: [
		{
			word: line.words[0]?.word ?? "",
			startTime: line.words[0]?.startTime ?? 0,
			endTime: lines[i + 1]?.words?.[0]?.startTime ?? Infinity,
		},
	],
	startTime: line.words[0]?.startTime ?? 0,
	endTime: lines[i + 1]?.words?.[0]?.startTime ?? Infinity,
	translatedLyric: "",
	romanLyric: "",
	isBG: false,
	isDuet: false,
});

export const LyricProvider: FC = () => {
	const musicId = useAtomValue(musicIdAtom);
	const setLyricLines = useSetAtom(lyricLinesAtom);

	useEffect(() => {
		let canceled = false;
		setLyricLines(undefined);

		(async () => {
			try {
				const currentRawLyricResp = await getLyric(musicId);
				const configTranslatedLyric = false;
				const configRomanLyric = false;
				const canUseDynamicLyric = !(
					!currentRawLyricResp?.yrc?.lyric ||
					(configTranslatedLyric &&
						(currentRawLyricResp?.tlyric?.lyric?.length ?? 0) > 0 &&
						!currentRawLyricResp.ytlrc) ||
					(configRomanLyric &&
						(currentRawLyricResp?.romalrc?.lyric?.length ?? 0) > 0 &&
						!currentRawLyricResp.yromalrc)
				);

				if (currentRawLyricResp?.yrc?.lyric) {
					const lines = parseYrc(currentRawLyricResp?.yrc?.lyric || "");
					const converted = lines.map(transformDynamicLyricLine);
					log("已加载逐词歌词", converted);
					setLyricLines(converted);
				} else {
					log(currentRawLyricResp?.lrc?.lyric || "");
					const lines = parseLrc(currentRawLyricResp?.lrc?.lyric || "");
					const converted = lines.map(transformLyricLine);
					log("已加载逐行歌词", lines, converted);
					setLyricLines(converted);
				}
			} catch (err) {
				warn("加载歌词失败", err);
			}
		})();

		return () => {
			canceled = true;
		};
	}, [musicId]);

	return <></>;
};

import { atom, useAtomValue, useSetAtom } from "jotai";
import { FC, useEffect } from "react";
import { musicIdAtom } from "../music-context/wrapper";
import { LyricLine as CoreLyricLine } from "@applemusic-like-lyrics/core";
import {
	parseLrc,
	parseYrc,
	type LyricLine,
} from "@applemusic-like-lyrics/lyric";
import { log, warn } from "../utils/logger";
import {
	showRomanLineAtom,
	showTranslatedLineAtom,
} from "../components/config/atoms";

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

type TransLine = {
	[K in keyof CoreLyricLine]: CoreLyricLine[K] extends string ? K : never;
}[keyof CoreLyricLine];

function pairLyric(line: LyricLine, lines: CoreLyricLine[], key: TransLine) {
	if (line.words.length === 0) return;
	const joined = line.words.map((w) => w.word).join("");
	let nearestLine: CoreLyricLine | undefined = undefined;
	for (const coreLine of lines) {
		if (coreLine.words.length > 0) {
			if (coreLine.startTime === line.words[0].startTime) {
				nearestLine = coreLine;
				break;
			} else if (
				nearestLine &&
				Math.abs(nearestLine.startTime - line.words[0].startTime) <
					Math.abs(coreLine.startTime - line.words[0].startTime)
			) {
				nearestLine = coreLine;
			} else if (nearestLine === undefined) {
				nearestLine = coreLine;
			}
		}
	}
	if (nearestLine) {
		if (nearestLine[key].length > 0) nearestLine[key] += joined;
		else nearestLine[key] = joined;
	}
}

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
	const showTranslatedLine = useAtomValue(showTranslatedLineAtom);
	const showRomanLine = useAtomValue(showRomanLineAtom);

	useEffect(() => {
		let canceled = false;
		setLyricLines(undefined);

		(async () => {
			try {
				const currentRawLyricResp = await getLyric(musicId);
				const canUseDynamicLyric = !(
					!currentRawLyricResp?.yrc?.lyric ||
					(showTranslatedLine &&
						(currentRawLyricResp?.tlyric?.lyric?.length ?? 0) > 0 &&
						!currentRawLyricResp.ytlrc) ||
					(showRomanLine &&
						(currentRawLyricResp?.romalrc?.lyric?.length ?? 0) > 0 &&
						!currentRawLyricResp.yromalrc)
				);

				let converted: CoreLyricLine[];

				if (canUseDynamicLyric) {
					const lines = parseYrc(currentRawLyricResp?.yrc?.lyric || "");
					converted = lines.map(transformDynamicLyricLine);

					if (showTranslatedLine && currentRawLyricResp?.ytlrc?.lyric) {
						const trans = parseLrc(currentRawLyricResp.ytlrc.lyric);
						trans.forEach((line) =>
							pairLyric(line, converted, "translatedLyric"),
						);
					}
					if (showRomanLine && currentRawLyricResp?.yromalrc?.lyric) {
						const trans = parseLrc(currentRawLyricResp.yromalrc.lyric);
						trans.forEach((line) => pairLyric(line, converted, "romanLyric"));
					}
					log("已加载逐词歌词", converted);
				} else {
					log(currentRawLyricResp?.lrc?.lyric || "");
					const lines = parseLrc(currentRawLyricResp?.lrc?.lyric || "");
					converted = lines.map(transformLyricLine);

					if (showTranslatedLine && currentRawLyricResp?.tlyric?.lyric) {
						const trans = parseLrc(currentRawLyricResp.tlyric.lyric);
						trans.forEach((line) =>
							pairLyric(line, converted, "translatedLyric"),
						);
					}
					if (showRomanLine && currentRawLyricResp?.romalrc?.lyric) {
						const trans = parseLrc(currentRawLyricResp.romalrc.lyric);
						trans.forEach((line) => pairLyric(line, converted, "romanLyric"));
					}
					log("已加载逐行歌词", lines, converted);
				}

				setLyricLines(converted);
			} catch (err) {
				warn("加载歌词失败", err);
			}
		})();

		return () => {
			canceled = true;
		};
	}, [musicId, showTranslatedLine, showRomanLine]);

	return <></>;
};

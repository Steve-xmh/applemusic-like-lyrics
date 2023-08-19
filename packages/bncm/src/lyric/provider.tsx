import { atom, useAtomValue, useSetAtom } from "jotai";
import { FC, useEffect } from "react";
import {
	musicArtistsAtom,
	musicIdAtom,
	musicNameAtom,
} from "../music-context/wrapper";
import { LyricLine as CoreLyricLine } from "@applemusic-like-lyrics/core";
import {
	parseLrc,
	parseYrc,
	parseQrc,
	parseLys,
	type LyricLine,
} from "@applemusic-like-lyrics/lyric";
import { log, warn } from "../utils/logger";
import {
	lyricSourcesAtom,
	showRomanLineAtom,
	showTranslatedLineAtom,
} from "../components/config/atoms";
import { useAtomCallback } from "jotai/utils";
import { parseTTML } from "@applemusic-like-lyrics/ttml";
import { LyricFormat, LyricSource, SourceStringError } from "./source";

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
async function getLyric(
	songId: string,
	signal?: AbortSignal,
): Promise<EAPILyricResponse> {
	const v = await fetch(
		`${APP_CONF.domain}/api/song/lyric/v1?tv=0&lv=0&rv=0&kv=0&yv=0&ytv=0&yrv=0&cp=false&id=${songId}`,
		{
			signal,
		},
	).catch((v) => {
		throw v;
	});
	if (v.ok) return await v.json();
	else throw v.statusText;
}

export const lyricLinesAtom = atom<CoreLyricLine[] | undefined>(undefined);

export const lyricProviderLogsAtom = atom(
	[] as {
		sourceId: string;
		log: string;
	}[],
);

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
	isBG: !!line.isBG,
	isDuet: !!line.isDuet,
});

async function getLyricFromExternal(
	source: LyricSource,
	params: { [sym: string]: string },
	showTranslatedLine: boolean,
	showRomanLine: boolean,
	abortSignal: AbortSignal,
) {
	let finalUrl = source.url;
	for (const sym in params) {
		finalUrl = finalUrl.replaceAll(`[${sym}]`, params[sym]);
	}
	let rawLyricData: string | undefined = undefined;
	if (finalUrl.startsWith("file:///")) {
		const readFilePath = finalUrl.slice(8);
		if (await betterncm.fs.exists(readFilePath)) {
			rawLyricData = await betterncm.fs.readFileText(readFilePath);
		} else {
			return undefined;
		}
	} else {
		const res = await fetch(finalUrl, {
			signal: abortSignal,
		}).catch((v) => {
			throw v;
		});
		if (res.ok) {
			rawLyricData = await res.text();
		}
	}
	if (rawLyricData) {
		let lines: CoreLyricLine[];
		switch (source.format) {
			case LyricFormat.LRC:
				lines = parseLrc(rawLyricData).map(transformLyricLine);
				break;
			case LyricFormat.TTML:
				lines = parseTTML(rawLyricData);
				break;
			case LyricFormat.YRC:
				lines = parseYrc(rawLyricData).map(transformLyricLine);
				break;
			case LyricFormat.QRC:
				lines = parseQrc(rawLyricData).map(transformLyricLine);
				break;
			case LyricFormat.LYS:
				lines = parseLys(rawLyricData).map(transformLyricLine);
				break;
			default:
				throw new SourceStringError(
					`未知或不支持的歌词文件格式 ${source.format}`,
				);
		}
		if (!showTranslatedLine)
			lines.forEach((line) => {
				line.translatedLyric = "";
			});
		if (!showRomanLine)
			lines.forEach((line) => {
				line.romanLyric = "";
			});
		return lines;
	} else {
		return undefined;
	}
}

async function getLyricFromDB(
	musicId: string,
	showTranslatedLine: boolean,
	showRomanLine: boolean,
	abortSignal: AbortSignal,
) {
	const res = await Promise.any([
		fetch(
			`https://gitcode.net/sn/amll-ttml-db/-/raw/main/lyrics/${musicId}.ttml?inline=false`,
			{
				signal: abortSignal,
			},
		)
			.then((res) => {
				if (res.ok) return res;
				else throw res;
			})
			.catch((v) => {
				throw v;
			}),
		fetch(
			`https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/lyrics/${musicId}.ttml`,
			{
				signal: abortSignal,
			},
		)
			.then((res) => {
				if (res.ok) return res;
				else throw res;
			})
			.catch((v) => {
				throw v;
			}),
	]);
	if (res.ok) {
		const lines = parseTTML(await res.text());
		if (!showTranslatedLine)
			lines.forEach((line) => {
				line.translatedLyric = "";
			});
		if (!showRomanLine)
			lines.forEach((line) => {
				line.romanLyric = "";
			});
		return lines;
	} else {
		return undefined;
	}
}

async function getLyricFromNCM(
	musicId: string,
	showTranslatedLine: boolean,
	showRomanLine: boolean,
	abortSignal: AbortSignal,
) {
	const currentRawLyricResp = await getLyric(musicId, abortSignal);
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
			trans.forEach((line) => pairLyric(line, converted, "translatedLyric"));
		}
		if (showRomanLine && currentRawLyricResp?.yromalrc?.lyric) {
			const trans = parseLrc(currentRawLyricResp.yromalrc.lyric);
			trans.forEach((line) => pairLyric(line, converted, "romanLyric"));
		}
	} else {
		log(currentRawLyricResp?.lrc?.lyric || "");
		const lines = parseLrc(currentRawLyricResp?.lrc?.lyric || "");
		converted = lines.map(transformLyricLine);

		if (showTranslatedLine && currentRawLyricResp?.tlyric?.lyric) {
			const trans = parseLrc(currentRawLyricResp.tlyric.lyric);
			trans.forEach((line) => pairLyric(line, converted, "translatedLyric"));
		}
		if (showRomanLine && currentRawLyricResp?.romalrc?.lyric) {
			const trans = parseLrc(currentRawLyricResp.romalrc.lyric);
			trans.forEach((line) => pairLyric(line, converted, "romanLyric"));
		}
	}

	return converted;
}

const searchLyricTaskAtom = atom(Symbol("search-lyric-task-atom"));
export const LyricProvider: FC = () => {
	const musicId = useAtomValue(musicIdAtom);
	const setLyricLines = useSetAtom(lyricLinesAtom);
	const showTranslatedLine = useAtomValue(showTranslatedLineAtom);
	const showRomanLine = useAtomValue(showRomanLineAtom);
	const setSearchLyricTask = useSetAtom(searchLyricTaskAtom);

	const searchLyric = useAtomCallback(
		async (
			get,
			set,
			allowTranslatedLine: boolean,
			allowRomanLine: boolean,
			abortSignal: AbortSignal,
		): Promise<CoreLyricLine[] | undefined> => {
			const curTask = Symbol("search-lyric-task-atom");
			set(searchLyricTaskAtom, curTask);
			const musicId = get(musicIdAtom);
			const songName = get(musicNameAtom);
			const artists = get(musicArtistsAtom);
			const artistsParam = artists.map((v) => v.name).join(",");
			const sources = await get(lyricSourcesAtom);
			set(lyricProviderLogsAtom, []);
			let loadedLyrics: CoreLyricLine[] | undefined = undefined;

			for (const source of sources) {
				if (get(searchLyricTaskAtom) !== curTask) return;
				try {
					switch (source.type) {
						case "external": {
							loadedLyrics = await getLyricFromExternal(
								source,
								{
									NCM_ID: musicId,
									SONG_NAME: songName,
									SONG_NAME_URI: encodeURIComponent(songName),
									SONG_ARTISTS: artistsParam,
									SONG_ARTISTS_URI: encodeURIComponent(artistsParam),
									SONG_ALIAS: "", // TODO: 其他称谓
									SONG_ALIAS_URI: "",
								},
								allowTranslatedLine,
								allowRomanLine,
								abortSignal,
							);
							break;
						}
						case "builtin:amll-ttml-db": {
							loadedLyrics = await getLyricFromDB(
								musicId,
								allowTranslatedLine,
								allowRomanLine,
								abortSignal,
							);
							break;
						}
						case "builtin:ncm": {
							loadedLyrics = await getLyricFromNCM(
								musicId,
								allowTranslatedLine,
								allowRomanLine,
								abortSignal,
							);
							break;
						}
					}
				} catch (err) {
					if (get(searchLyricTaskAtom) !== curTask) return;
					set(lyricProviderLogsAtom, (v) => [
						...v,
						{
							sourceId: source.id,
							log: `查询该歌词源时发生错误： ${err}`,
						},
					]);
					continue;
				}

				if (get(searchLyricTaskAtom) !== curTask) return;
				if (loadedLyrics === undefined) {
					set(lyricProviderLogsAtom, (v) => [
						...v,
						{
							sourceId: source.id,
							log: "未找到歌词",
						},
					]);
				} else {
					set(lyricProviderLogsAtom, (v) => [
						...v,
						{
							sourceId: source.id,
							log: "已找到歌词",
						},
					]);
					break;
				}
			}

			set(lyricLinesAtom, loadedLyrics);
		},
	);

	useEffect(() => {
		setLyricLines(undefined);

		const ac = new AbortController();

		searchLyric(showTranslatedLine, showRomanLine, ac.signal);

		return () => {
			setSearchLyricTask(Symbol("search-lyric-task-atom"));
			ac.abort("effect-destoryed");
		};
	}, [musicId, showTranslatedLine, showRomanLine]);

	return <></>;
};

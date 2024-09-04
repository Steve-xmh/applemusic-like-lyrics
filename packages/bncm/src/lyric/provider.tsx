/*
 * Copyright 2012-2023 Steve Xiao (stevexmh@qq.com) and contributors.
 *
 * 本源代码文件是属于 Apple Music-like Lyrics 项目的一部分。
 * This source code file is a part of Apple Music-like Lyrics project.
 * 本项目的源代码的使用受到 GNU GENERAL PUBLIC LICENSE version 3 许可证的约束，具体可以参阅以下链接。
 * Use of this source code is governed by the GNU GPLv3 license that can be found through the following link.
 *
 * https://github.com/Steve-xmh/applemusic-like-lyrics/blob/main/LICENSE
 */

import { atom, useAtomValue, useSetAtom } from "jotai";
import { FC, useEffect } from "react";
import {
	loadableMusicOverrideDataAtom,
	LyricOverrideType,
	musicArtistsAtom,
	musicIdAtom,
	musicNameAtom,
} from "../music-context/wrapper";
import { LyricLine as CoreLyricLine } from "@applemusic-like-lyrics/core";
import {
	type LyricLine,
	parseLrc,
	parseLys,
	parseQrc,
	parseYrc,
} from "@applemusic-like-lyrics/lyric";
import { log, warn } from "../utils/logger";
import {
	lyricAdvanceDynamicLyricTimeAtom,
	lyricSourcesAtom,
	showRomanLineAtom,
	showTranslatedLineAtom,
} from "../components/config/atoms";
import { parseTTML } from "@applemusic-like-lyrics/ttml";
import { LyricFormat, LyricSource, SourceStringError } from "./source";
import { processLyric, processLyric2 } from "./processor";
import { Loadable } from "jotai/vanilla/utils/loadable";
import { raceLoad } from "../utils/race-load";

interface EAPILyric {
	version: number;
	lyric: string;
}

export interface EAPILyricResponse extends EAPIResponse {
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
		`${
			window?.APP_CONF?.domain ?? "https://music.163.com"
		}/api/song/lyric/v1?tv=0&lv=0&rv=0&kv=0&yv=0&ytv=0&yrv=0&cp=false&id=${songId}`,
		{
			signal,
		},
	).catch((v) => {
		throw v;
	});
	if (v.ok) return await v.json();
	throw v.statusText;
}

export const getLyricFromNCMAtom = atom({ getLyric });

// export const lyricLinesAtom = atom<CoreLyricLine[] | undefined>(undefined);

export const lyricProviderLogsAtom = atom(
	[] as {
		sourceId: string;
		log: string;
	}[],
);

const transformDynamicLyricLine = (
	line: LyricLine,
	_i: number,
	_lines: LyricLine[],
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
	if (
		line.words
			.map((v) => v.word)
			.join("")
			.trim().length === 0
	)
		return;
	interface PairedLine {
		startTime: number;
		lineText: string;
		origIndex: number;
		original: CoreLyricLine;
	}
	const processed: PairedLine[] = lines.map((v, i) => ({
		startTime: Math.min(v.startTime, ...v.words.map((v) => v.startTime)),
		origIndex: i,
		lineText: v.words
			.map((v) => v.word)
			.join("")
			.trim(),
		original: v,
	}));
	let nearestLine: PairedLine | undefined = undefined;
	for (const coreLine of processed) {
		if (coreLine.lineText.length > 0) {
			if (coreLine.startTime === line.words[0].startTime) {
				nearestLine = coreLine;
				break;
			}
			if (
				nearestLine &&
				Math.abs(nearestLine.startTime - line.words[0].startTime) >
					Math.abs(coreLine.startTime - line.words[0].startTime)
			) {
				nearestLine = coreLine;
			} else if (nearestLine === undefined) {
				nearestLine = coreLine;
			}
		}
	}
	if (nearestLine) {
		const joined = line.words.map((w) => w.word).join("");
		if (nearestLine.original[key].length > 0)
			nearestLine.original[key] += joined;
		else nearestLine.original[key] = joined;
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
				// TODO: 提供歌词元数据
				lines = parseTTML(rawLyricData).lyricLines;
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
			for (const line of lines) line.translatedLyric = "";
		if (!showRomanLine) for (const line of lines) line.romanLyric = "";
		return lines;
	}
	return undefined;
}

async function getLyricFromDB(
	musicId: string,
	showTranslatedLine: boolean,
	showRomanLine: boolean,
	abortSignal: AbortSignal,
) {
	try {
		const urls = [
			`https://gitcode.net/sn/amll-ttml-db/-/raw/main/ncm-lyrics/${musicId}.ttml?inline=false`,
			`https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/ncm-lyrics/${musicId}.ttml`,
			`https://mirror.ghproxy.com/https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/ncm-lyrics/${musicId}.ttml`,
			`https://gh.api.99988866.xyz/https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/ncm-lyrics/${musicId}.ttml`,
		];
		const res = await Promise.any(
			urls.map((url) =>
				fetch(url, {
					signal: abortSignal,
				})
					.then((res) => {
						if (res.ok) return res;
						throw res;
					})
					.catch((v) => {
						throw v;
					}),
			),
		);
		if (res.ok) {
			// TODO: 提供歌词元数据
			const lines = parseTTML(await res.text()).lyricLines;
			if (!showTranslatedLine)
				for (const line of lines) line.translatedLyric = "";
			if (!showRomanLine) for (const line of lines) line.romanLyric = "";
			return lines;
		}
		return undefined;
	} catch {
		return undefined;
	}
}

async function getLyricFromNCM(
	musicId: string,
	showTranslatedLine: boolean,
	showRomanLine: boolean,
	abortSignal: AbortSignal,
	lyricGetter: typeof getLyric = getLyric,
) {
	const currentRawLyricResp = await lyricGetter(musicId, abortSignal);
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
		processLyric2(converted);
		log("已解析 YRC 歌词", JSON.parse(JSON.stringify(converted)));

		if (showTranslatedLine && currentRawLyricResp?.ytlrc?.lyric) {
			const trans = parseLrc(currentRawLyricResp.ytlrc.lyric);
			log("已解析译文歌词", JSON.parse(JSON.stringify(trans)));
			if (trans.length === converted.length) {
				trans.forEach((line, i) => {
					converted[i].translatedLyric = line.words
						.reduce((pv: string, cv) => pv + cv.word, "")
						.trim();
				});
			} else {
				for (const line of trans) {
					pairLyric(line, converted, "translatedLyric");
				}
			}
		}
		if (showRomanLine && currentRawLyricResp?.yromalrc?.lyric) {
			const roman = parseLrc(currentRawLyricResp.yromalrc.lyric);
			log("已解析音译歌词", JSON.parse(JSON.stringify(roman)));
			if (roman.length === converted.length) {
				roman.forEach((line, i) => {
					converted[i].romanLyric = line.words
						.reduce((pv: string, cv) => pv + cv.word, "")
						.trim();
				});
			} else {
				for (const line of roman) {
					pairLyric(line, converted, "romanLyric");
				}
			}
		}
	} else {
		log(currentRawLyricResp?.lrc?.lyric || "");
		const lines = parseLrc(currentRawLyricResp?.lrc?.lyric || "");
		converted = lines.map(transformLyricLine);

		if (showTranslatedLine && currentRawLyricResp?.tlyric?.lyric) {
			const trans = parseLrc(currentRawLyricResp.tlyric.lyric);
			if (trans.length === converted.length) {
				trans.forEach((line, i) => {
					converted[i].translatedLyric = line.words
						.reduce((pv: string, cv) => pv + cv.word, "")
						.trim();
				});
			} else {
				for (const line of trans) {
					pairLyric(line, converted, "translatedLyric");
				}
			}
		}
		if (showRomanLine && currentRawLyricResp?.romalrc?.lyric) {
			const roman = parseLrc(currentRawLyricResp.romalrc.lyric);
			if (roman.length === converted.length) {
				roman.forEach((line, i) => {
					converted[i].romanLyric = line.words
						.reduce((pv: string, cv) => pv + cv.word, "")
						.trim();
				});
			} else {
				for (const line of roman) {
					pairLyric(line, converted, "romanLyric");
				}
			}
		}
	}

	// 是否为纯音乐
	console.log(converted);
	// console.log(converted.length === 1,
	// 	converted[0].startTime === 5940000,
	// 	converted[0].endTime === Infinity,
	// 	converted[0].words[0].startTime === 5940000,
	// 	converted[0].words[0].endTime === Infinity,
	// 	converted[0].words[0].word === "纯音乐，请欣赏",
	// 	converted[0].translatedLyric === "",
	// 	converted[0].romanLyric === "",
	// 	converted[0].isBG === false,
	// 	converted[0].isDuet === false);
	if (
		converted.length === 1 &&
		converted[0].endTime === Infinity &&
		converted[0].words[0].endTime === Infinity &&
		converted[0].words[0].word === "纯音乐，请欣赏" &&
		converted[0].translatedLyric === "" &&
		converted[0].romanLyric === "" &&
		converted[0].isBG === false &&
		converted[0].isDuet === false
	) {
		return {
			type: "pure-music",
			lines: [],
		};
	}

	return {
		type: "music",
		lines: converted,
	};
}

class LyricNotExistError extends Error {}

const rawLyricLinesAtom = atom({
	state: "loading",
} as Loadable<CoreLyricLine[]>);

export const usingLyricSourceAtom = atom({
	state: "loading",
} as Loadable<LyricSource>);

export const lyricLinesAtom = atom(
	(get): Loadable<CoreLyricLine[]> => {
		const result = get(rawLyricLinesAtom);
		const overrideData = get(loadableMusicOverrideDataAtom);
		if (result.state === "hasData" && overrideData.state === "hasData") {
			let overrideLines = result.data;

			function checkTranslatedAndRomanLyric(
				lyricOverrideTranslatedLyricData?: string,
				lyricOverrideRomanLyricData?: string,
			) {
				if (lyricOverrideTranslatedLyricData) {
					const translated = parseLrc(lyricOverrideTranslatedLyricData);
					for (const line of translated) {
						pairLyric(line, overrideLines, "translatedLyric");
					}
				}
				if (lyricOverrideRomanLyricData) {
					const translated = parseLrc(lyricOverrideRomanLyricData);
					for (const line of translated) {
						pairLyric(line, overrideLines, "romanLyric");
					}
				}
			}

			switch (overrideData.data.lyricOverrideType) {
				case LyricOverrideType.PureMusic:
					overrideLines = [];
					break;
				case LyricOverrideType.LocalLRC:
					if (overrideData.data.lyricOverrideOriginalLyricData) {
						overrideLines = parseLrc(
							overrideData.data.lyricOverrideOriginalLyricData,
						).map(transformLyricLine);
						checkTranslatedAndRomanLyric(
							overrideData.data.lyricOverrideTranslatedLyricData,
							overrideData.data.lyricOverrideRomanLyricData,
						);
					}
					break;
				case LyricOverrideType.LocalYRC:
					if (overrideData.data.lyricOverrideOriginalLyricData) {
						overrideLines = parseYrc(
							overrideData.data.lyricOverrideOriginalLyricData,
						).map(transformLyricLine);
						checkTranslatedAndRomanLyric(
							overrideData.data.lyricOverrideTranslatedLyricData,
							overrideData.data.lyricOverrideRomanLyricData,
						);
					}
					break;
				case LyricOverrideType.LocalQRC:
					if (overrideData.data.lyricOverrideOriginalLyricData) {
						overrideLines = parseQrc(
							overrideData.data.lyricOverrideOriginalLyricData,
						).map(transformLyricLine);
						checkTranslatedAndRomanLyric(
							overrideData.data.lyricOverrideTranslatedLyricData,
							overrideData.data.lyricOverrideRomanLyricData,
						);
					}
					break;
				case LyricOverrideType.LocalTTML:
					if (overrideData.data.lyricOverrideOriginalLyricData)
						// TODO: 提供歌词元数据
						overrideLines = parseTTML(
							overrideData.data.lyricOverrideOriginalLyricData,
						).lyricLines;
					break;
				default:
			}
			if (overrideData.data.lyricOffset !== undefined) {
				const lyricOffset = overrideData.data.lyricOffset;
				overrideLines = overrideLines.map((line) => ({
					...line,
					startTime: line.startTime - lyricOffset,
					endTime: line.endTime - lyricOffset,
					words: line.words.map((word) => ({
						...word,
						startTime: word.startTime - lyricOffset,
						endTime: word.endTime - lyricOffset,
					})),
				}));
			}
			const lyricAdvanceDynamicLyricTime = get(
				lyricAdvanceDynamicLyricTimeAtom,
			);
			if (lyricAdvanceDynamicLyricTime) {
				let i = 0;
				for (const line of overrideLines) {
					// if (line.words.length > 0) {
					const delta = Math.abs(
						Math.max(0, line.startTime - 400) - line.startTime,
					);
					const nextLine = overrideLines[i + 1];
					if (nextLine) {
						if (nextLine.startTime < line.endTime) {
							line.endTime -= 400;
						} else if (nextLine.startTime - line.endTime < 5000) {
							line.endTime = nextLine.startTime - 400;
						}
					} else {
						line.endTime -= 400;
					}
					line.startTime -= delta;
					// }
					i++;
				}
			}
			return {
				state: "hasData",
				data: overrideLines,
			};
		}
		return result;
	},
	(_get, set, update: Loadable<CoreLyricLine[]>) => {
		set(rawLyricLinesAtom, update);
	},
);

export const LyricProvider: FC = () => {
	const musicId = useAtomValue(musicIdAtom);
	const songName = useAtomValue(musicNameAtom);
	const artists = useAtomValue(musicArtistsAtom);
	const lyricSources = useAtomValue(lyricSourcesAtom);
	const { getLyric } = useAtomValue(getLyricFromNCMAtom);
	const allowTranslatedLine = useAtomValue(showTranslatedLineAtom);
	const allowRomanLine = useAtomValue(showRomanLineAtom);
	const setLyricProviderLogs = useSetAtom(lyricProviderLogsAtom);
	const setLyricLines = useSetAtom(rawLyricLinesAtom);
	const setLyricSource = useSetAtom(usingLyricSourceAtom);

	useEffect(() => {
		setLyricProviderLogs([]);
		setLyricLines({
			state: "loading",
		});
		setLyricSource({
			state: "loading",
		});

		const cancel = raceLoad(
			lyricSources,
			async (source, { signal }): Promise<CoreLyricLine[]> => {
				// log("正在搜索歌词源", source, musicId);

				switch (source.type) {
					case "external": {
						const artistsParam = artists.map((v) => v.name).join(",");
						const lines = await getLyricFromExternal(
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
							signal,
						);
						if (lines) {
							return lines;
						}
						throw new LyricNotExistError();
					}
					case "builtin:amll-ttml-db": {
						const lines = await getLyricFromDB(
							musicId,
							allowTranslatedLine,
							allowRomanLine,
							signal,
						);
						if (lines) {
							return lines;
						}
						throw new LyricNotExistError();
					}
					case "builtin:ncm": {
						const lines = await getLyricFromNCM(
							musicId,
							allowTranslatedLine,
							allowRomanLine,
							signal,
							getLyric,
						);
						if (lines.type === "music") {
							return lines.lines;
						}
						if (lines.type === "pure-music") {
							return [];
						}
						throw new LyricNotExistError();
					}
				}
			},
			(source, _index, result) => {
				log("已设置歌词为来自歌词源", source, "的", result);
				setLyricSource({
					state: "hasData",
					data: source,
				});
				setLyricLines(result);
			},
			(source, _index, result) => {
				if (result.state === "hasData") {
					setLyricProviderLogs((v) => [
						...v,
						{
							sourceId: source.id,
							log: "已找到歌词",
						},
					]);
				} else if (result.state === "hasError") {
					if (result.error instanceof LyricNotExistError) {
						setLyricProviderLogs((v) => [
							...v,
							{
								sourceId: source.id,
								log: "未找到歌词",
							},
						]);
					} else {
						warn("查询该歌词源时发生错误：", source.id, result.error);
						setLyricProviderLogs((v) => [
							...v,
							{
								sourceId: source.id,
								log: `查询该歌词源时发生错误： ${result.error}`,
							},
						]);
					}
				}
			},
		);

		return () => {
			cancel();
		};
	}, [
		musicId,
		lyricSources,
		allowTranslatedLine,
		allowRomanLine,
		artists,
		songName,
	]);

	return <></>;
};

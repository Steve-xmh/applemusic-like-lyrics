import { getConfig } from "../config/core";
import pangu from "pangu/dist/browser/pangu.min.js";
import { DynamicLyricWord, LyricLine, LyricPureLine } from "./lyric-types";
// import { guessTextReadDuration } from "../utils";

export const PURE_MUSIC_LYRIC_LINE: LyricLine[] = [
	{
		beginTime: 0,
		duration: 5940000,
		originalLyric: "纯音乐，请欣赏",
	},
];

export const PURE_MUSIC_LYRIC_DATA = {
	sgc: false,
	sfy: false,
	qfy: false,
	needDesc: true,
	lrc: {
		version: 1,
		lyric: "[99:00.00]纯音乐，请欣赏\n",
	},
	code: 200,
	briefDesc: null,
};

export function parseLyric(
	original: string,
	translated: string,
	roman: string,
	dynamic: string,
): LyricLine[] {
	if (dynamic.trim().length === 0) {
		const result: LyricLine[] = parsePureLyric(original).map((v) => ({
			beginTime: v.time,
			originalLyric: v.lyric,
			duration: 0,
		}));

		parsePureLyric(translated).forEach((line) => {
			const target = result.find((v) => v.beginTime === line.time);
			if (target) {
				target.translatedLyric = line.lyric;
			}
		});

		parsePureLyric(roman).forEach((line) => {
			const target = result.find((v) => v.beginTime === line.time);
			if (target) {
				target.romanLyric = line.lyric;
			}
		});

		result.sort((a, b) => a.beginTime - b.beginTime);

		// log("原始歌词解析", JSON.parse(JSON.stringify(result)));

		const processed = processLyric(result);

		// log("处理完成歌词解析", JSON.parse(JSON.stringify(processed)));

		for (let i = 0; i < processed.length; i++) {
			if (i < processed.length - 1) {
				processed[i].duration =
					processed[i + 1].beginTime - processed[i].beginTime;
			}
		}

		return processLyric(result);
	} else {
		const processed = parsePureDynamicLyric(dynamic);

		parsePureLyric(translated).forEach((line) => {
			let target = processed.find((v) => v.beginTime === line.time);
			if (!target) {
				processed.forEach((v) => {
					if (target) {
						if (
							Math.abs(target.beginTime - line.time) >
							Math.abs(v.beginTime - line.time)
						) {
							target = v;
						}
					} else {
						target = v;
					}
				});
			}
			if (target) {
				target.translatedLyric = target.translatedLyric || "";
				if (target.translatedLyric.length > 0) {
					target.translatedLyric += " ";
				}
				target.translatedLyric += line.lyric;
			}
		});

		parsePureLyric(roman).forEach((line) => {
			let target: LyricLine | null = null;
			for (const v of processed) {
				if (target) {
					if (
						Math.abs(target.beginTime - line.time) >
						Math.abs(v.beginTime - line.time)
					) {
						target = v;
					}
				} else {
					target = v;
				}
			}
			if (target) {
				target.romanLyric = target.romanLyric || "";
				if (target.romanLyric.length > 0) {
					target.romanLyric += " ";
				}
				target.romanLyric += line.lyric;
			}
		});

		// 合并没有译文的歌词
		if (getConfig("mergeOriginalOnlyLine", "false") === "true") {
			if (translated.trim().length + roman.trim().length > 0) {
				let i = 0;
				while (processed[i]) {
					if (
						i &&
						((translated.trim().length > 0 &&
							processed[i].translatedLyric === undefined) ||
							(roman.trim().length > 0 &&
								processed[i].romanLyric === undefined))
					) {
						const mergeLine = processed.splice(i, 1)[0];
						const dynamicLyric = mergeLine.dynamicLyric || [];
						processed[i - 1].dynamicLyric?.push(
							{
								word: " ",
								time: processed[i - 1].beginTime + processed[i - 1].duration,
								duration: 0,
								flag: 0,
							},
							...dynamicLyric,
						);
						processed[i - 1].duration =
							mergeLine.duration +
							mergeLine.beginTime -
							processed[i - 1].beginTime;
					} else {
						i++;
					}
				}
			}
		}

		// 插入空行
		for (let i = 0; i < processed.length; i++) {
			const thisLine = processed[i];
			const nextLine = processed[i + 1];
			if (
				thisLine &&
				nextLine &&
				thisLine.originalLyric.trim().length > 0 &&
				nextLine.originalLyric.trim().length > 0 &&
				thisLine.duration > 0
			) {
				const thisLineEndTime =
					(thisLine?.dynamicLyricTime || thisLine.beginTime) +
					thisLine.duration;
				let nextLineStartTime = nextLine.beginTime;
				if (
					nextLine.dynamicLyricTime &&
					nextLineStartTime > nextLine.dynamicLyricTime
				) {
					nextLineStartTime = nextLine.dynamicLyricTime;
				}
				if (nextLineStartTime - thisLineEndTime >= 5000) {
					processed.splice(i + 1, 0, {
						beginTime: thisLineEndTime,
						originalLyric: "",
						duration: nextLineStartTime - thisLineEndTime,
					});
				}
			}
		}
		return processLyric(processed);
	}
}

const yrcLineRegexp = /^\[(?<time>[0-9]+),(?<duration>[0-9]+)\](?<line>.*)/;
const yrcWordTimeRegexp =
	/^\((?<time>[0-9]+),(?<duration>[0-9]+),(?<flag>[0-9]+)\)(?<word>[^\(]*)/;
const timeRegexp = /^\[((?<min>[0-9]+):)?(?<sec>[0-9]+([\.:]([0-9]+))?)\]/;

function parsePureLyric(lyric: string): LyricPureLine[] {
	const result: LyricPureLine[] = [];

	for (const line of lyric.split("\n")) {
		let lyric = line.trim();
		const timestamps: number[] = [];
		while (true) {
			const matches = lyric.match(timeRegexp);
			if (matches) {
				const min = Number(matches.groups?.min || "0");
				const sec = Number(matches.groups?.sec.replace(/:/, ".") || "0");
				timestamps.push(Math.floor((min * 60 + sec) * 1000));
				lyric =
					lyric.slice(0, matches.index) +
					lyric.slice((matches.index || 0) + matches[0].length);
				lyric = lyric.trim();
			} else {
				break;
			}
		}
		lyric = lyric.trim();
		for (const time of timestamps) {
			result.push({
				time,
				lyric,
			});
		}
	}

	result.sort((a, b) => a.time - b.time);

	return result;
}

export function parsePureDynamicLyric(lyric: string): LyricLine[] {
	const result: LyricLine[] = [];
	// 解析逐词歌词
	for (const line of lyric.trim().split("\n")) {
		let tmp = line.trim();
		const lineMatches = tmp.match(yrcLineRegexp);
		if (lineMatches) {
			const time = parseInt(lineMatches.groups?.time || "0");
			const duration = parseInt(lineMatches.groups?.duration || "0");
			tmp = lineMatches.groups?.line || "";
			const words: DynamicLyricWord[] = [];
			while (tmp.length > 0) {
				const wordMatches = tmp.match(yrcWordTimeRegexp);
				if (wordMatches) {
					const wordTime = parseInt(wordMatches.groups?.time || "0");
					const wordDuration = parseInt(wordMatches.groups?.duration || "0");
					const flag = parseInt(wordMatches.groups?.flag || "0");
					const word = wordMatches.groups?.word.trimStart();
					const splitedWords = word
						?.split(/\s+/)
						.filter((v) => v.trim().length > 0); // 有些歌词一个单词还是一个句子的就离谱
					if (splitedWords) {
						const splitedDuration = wordDuration / splitedWords.length;
						splitedWords.forEach((subWord, i) => {
							if (i === splitedWords.length - 1) {
								if (word?.endsWith(" ")) {
									words.push({
										time: wordTime + i * splitedDuration,
										duration: splitedDuration,
										flag,
										word: `${subWord.trimStart()} `,
									});
								} else {
									words.push({
										time: wordTime + i * splitedDuration,
										duration: splitedDuration,
										flag,
										word: subWord.trimStart(),
									});
								}
							} else if (i === 0) {
								if (word?.startsWith(" ")) {
									words.push({
										time: wordTime + i * splitedDuration,
										duration: splitedDuration,
										flag,
										word: ` ${subWord.trimStart()}`,
									});
								} else {
									words.push({
										time: wordTime + i * splitedDuration,
										duration: splitedDuration,
										flag,
										word: subWord.trimStart(),
									});
								}
							} else {
								words.push({
									time: wordTime + i * splitedDuration,
									duration: splitedDuration,
									flag,
									word: `${subWord.trimStart()} `,
								});
							}
						});
					}
					tmp = tmp.slice(wordMatches.index || 0 + wordMatches[0].length);
				} else {
					break;
				}
			}
			const line: LyricLine = {
				beginTime: time,
				duration,
				originalLyric: words.map((v) => v.word).join(""),
				dynamicLyric: words,
				dynamicLyricTime: time,
			};
			result.push(line);
			// log("逐词歌词", time, duration, line.originalLyric);
		}
	}
	return result;
}

// 处理歌词，去除一些太短的空格间曲段，并为前摇太长的歌曲加前导空格
export function processLyric(lyric: LyricLine[]): LyricLine[] {
	if (
		lyric.length > 0 &&
		lyric[lyric.length - 1].beginTime === 5940000 &&
		lyric[lyric.length - 1].duration === 0
	) {
		// 纯音乐，请欣赏
		return PURE_MUSIC_LYRIC_LINE;
	}

	const result: LyricLine[] = [];

	let isSpace = false;
	lyric.forEach((thisLyric, i, lyric) => {
		if (thisLyric.originalLyric.trim().length === 0) {
			const nextLyric = lyric[i + 1];
			if (
				nextLyric &&
				nextLyric.beginTime - thisLyric.beginTime > 5000 &&
				!isSpace
			) {
				result.push(thisLyric);
				isSpace = true;
			}
		} else {
			thisLyric.originalLyric = pangu.spacing(thisLyric.originalLyric);
			isSpace = false;
			result.push(thisLyric);
			const nextLyric = lyric[i + 1];
			if (
				nextLyric &&
				nextLyric.beginTime - (thisLyric.beginTime + thisLyric.duration) > 5000
			) {
				result.push({
					beginTime: thisLyric.beginTime + thisLyric.duration,
					duration:
						nextLyric.beginTime - thisLyric.beginTime - thisLyric.duration,
					originalLyric: "",
				});
				isSpace = true;
			}
		}
	});

	if (getConfig("enableLyricBuffer", "false") === "true") {
		// TODO: 通过预估的阅读时间增加缓冲
		result.forEach((line) => {
			if (line.originalLyric.trim().length > 0) {
				// const guessTime = guessTextReadDuration(line.originalLyric);
			}
		});
	}

	while (result[0]?.originalLyric.length === 0) {
		result.shift();
	}

	if (result[0]?.beginTime > 5000) {
		result.unshift({
			beginTime: 500,
			duration: result[0]?.beginTime - 500,
			originalLyric: "",
		});
	}

	return result;
}
export { LyricLine };

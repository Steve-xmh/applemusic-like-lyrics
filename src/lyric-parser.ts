import { log } from "./logger";

export interface DynamicLyricWord {
	time: number;
	duration: number;
	flag: number;
	word: string;
}

export interface LyricLine {
	time: number;
	duration: number;
	originalLyric: string;
	translatedLyric?: string;
	romanLyric?: string;
	dynamicLyricTime?: number;
	dynamicLyric?: DynamicLyricWord[];
}

export interface LyricPureLine {
	time: number;
	lyric: string;
}

export function parseLyric(
	original: string,
	translated: string,
	roman: string,
	dynamic: string,
): LyricLine[] {
	const result: LyricLine[] = parsePureLyric(original).map((v) => ({
		time: v.time,
		originalLyric: v.lyric,
		duration: 0,
	}));

	parsePureLyric(translated).forEach((line) => {
		const target = result.find((v) => v.time === line.time);
		if (target) {
			target.translatedLyric = line.lyric;
		}
	});

	parsePureLyric(roman).forEach((line) => {
		const target = result.find((v) => v.time === line.time);
		if (target) {
			target.romanLyric = line.lyric;
		}
	});

	result.sort((a, b) => a.time - b.time);

	const processed = processLyric(result);

	if (dynamic.trim().length > 0) {
		// 解析逐词歌词
		for (const line of dynamic.trim().split("\n")) {
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
						const word = wordMatches.groups?.word;
						if (word) {
							words.push({
								time: wordTime,
								duration: wordDuration,
								flag,
								word,
							});
						}
						tmp = tmp.slice(wordMatches.index || 0 + wordMatches[0].length);
					} else {
						break;
					}
				}
				let nearestLine: LyricLine | null = null;
				for (const line of processed) {
					if (nearestLine) {
						if (
							Math.abs(nearestLine.time - time) > Math.abs(line.time - time)
						) {
							nearestLine = line;
						}
					} else {
						nearestLine = line;
					}
				}
				if (nearestLine) {
					nearestLine.dynamicLyric = words;
					nearestLine.dynamicLyricTime = time;
					nearestLine.duration = duration;
					log(nearestLine);
				}
			}
		}
	} else {
		for (let i = 0; i < processed.length; i++) {
			if (i < processed.length - 1) {
				processed[i].duration = processed[i + 1].time - processed[i].time;
			}
		}
	}

	return processed;
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

// 处理歌词，去除一些太短的空格间曲段，并为前摇太长的歌曲加前导空格
export function processLyric(lyric: LyricLine[]): LyricLine[] {
	const result: LyricLine[] = [];

	// 过滤开头结尾的部分音乐信息
	const keywords = [" : ", "：", "-"];
	let removed = true;
	while (removed) {
		removed = false;
		for (const keyword of keywords) {
			if (lyric[0]?.originalLyric?.includes(keyword)) {
				lyric.shift();
				removed = true;
				break;
			}
		}
	}
	removed = true;
	while (removed) {
		removed = false;
		for (const keyword of keywords) {
			if (lyric[lyric.length - 1]?.originalLyric?.includes(keyword)) {
				lyric.pop();
				removed = true;
				break;
			}
		}
	}

	let isSpace = false;
	lyric.forEach((thisLyric, i, lyric) => {
		if (thisLyric.originalLyric.trim().length === 0) {
			const nextLyric = lyric[i + 1];
			if (nextLyric && nextLyric.time - thisLyric.time > 5000 && !isSpace) {
				result.push(thisLyric);
				isSpace = true;
			}
		} else {
			isSpace = false;
			result.push(thisLyric);
		}
	});

	while (result[0]?.originalLyric.length === 0) {
		result.shift();
	}

	if (result[0]?.time > 5000) {
		result.unshift({
			time: 500,
			duration: result[0]?.time - 500,
			originalLyric: "",
		});
	}

	return result;
}

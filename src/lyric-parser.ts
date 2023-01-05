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

	log("原始歌词解析", JSON.parse(JSON.stringify(result)));

	const processed = processLyric(result);

	log("处理完成歌词解析", JSON.parse(JSON.stringify(processed)));

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
				log("逐词歌词", time, duration, words.map((v) => v.word).join(""));
				for (const line of processed) {
					if (nearestLine) {
						if (
							line.originalLyric.trim().length > 0 &&
							Math.abs(nearestLine.time - time) > Math.abs(line.time - time)
						) {
							nearestLine = line;
						}
					} else if (line.originalLyric.trim().length > 0) {
						nearestLine = line;
					}
				}
				if (nearestLine) {
					if (
						nearestLine.dynamicLyric !== undefined &&
						nearestLine.dynamicLyricTime !== undefined &&
						nearestLine.duration !== undefined &&
						time - nearestLine.dynamicLyricTime >= 0
					) {
						const innerDuration = time - nearestLine.dynamicLyricTime;
						nearestLine.duration =
							time - nearestLine.dynamicLyricTime + duration;
						nearestLine.dynamicLyric = [
							...nearestLine.dynamicLyric,
							{
								time: time,
								duration: 0,
								flag: 0,
								word: " ",
							},
							...words,
						];
					} else {
						nearestLine.dynamicLyric = words;
						nearestLine.dynamicLyricTime = time;
						nearestLine.duration = duration;
					}
					// log(nearestLine);
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
					(thisLine?.dynamicLyricTime || thisLine.time) + thisLine.duration;
				const nextLineStartTime = nextLine?.dynamicLyricTime || nextLine.time;
				if (nextLineStartTime - thisLineEndTime >= 5000) {
					processed.splice(i + 1, 0, {
						time: thisLineEndTime,
						originalLyric: "",
						duration: nextLineStartTime - thisLineEndTime,
					});
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

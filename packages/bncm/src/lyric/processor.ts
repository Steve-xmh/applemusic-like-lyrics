/**
 * 歌词后处理器，包括但不限于：
 *
 * - 合并单独的标点符号单词
 * - 合并时长不合法的单词
 */

import { LyricWord, LyricLine } from "@applemusic-like-lyrics/lyric";

const IS_SYMBOLS = /^[!"#$%&’()*+,-./:;<=>?@\[\]^_`\{|\}~ ]+$/u;

export function processLyric(original: LyricLine[]) {
	for (const origLine of original) {
		const newWords: LyricWord[] = [];
		let prependWord: LyricWord | undefined = undefined;
		// 合并单独作为标点符号的单词
		origLine.words.forEach((word, i) => {
			// 替换'（'为' ('
			word.word = word.word.replace("（", " (");
			// 替换'）'为') '
			word.word = word.word.replace("）", ") ");

			if (prependWord) {
				word.word = prependWord.word + word.word;
				word.startTime = Math.min(prependWord.startTime, word.startTime);
				prependWord = undefined;
			}
			if (IS_SYMBOLS.test(word.word)) {
				if (newWords.length > 0) {
					const lastNewWord = newWords[newWords.length - 1];
					lastNewWord.word += word.word;
					lastNewWord.endTime = Math.max(word.endTime, lastNewWord.endTime);
				} else {
					prependWord = {
						...word,
					};
				}
			} else {
				newWords.push(word);
			}
		});
		if (prependWord) {
			newWords.push(prependWord);
		}
		origLine.words = newWords;
	}
}

export function processLyric2(original: LyricLine[]) {
	// 判断是否有括号存在的标志
	let needNonDynamic = false;

	// 遍历原始歌词行
	for (const origLine of original) {
		// 检查当前歌词行中的单词是否包含括号
		if (origLine.words.some((word) => /[\(\)（）]/.test(word.word))) {
			needNonDynamic = true;
		}
		if (origLine.words.some((word) => word.endTime - word.startTime >= 6000)) {
			needNonDynamic = true;
		}
		if (needNonDynamic) break;
	}

	if (needNonDynamic) {
		for (const origLine of original) {
			let newLineStr = "";
			origLine.words.forEach((word, i) => {
				// 替换'（'为' ('
				word.word = word.word.replace("（", " (");
				// 替换'）'为') '
				word.word = word.word.replace("）", ") ");
				newLineStr += word.word;
			});
			if (newLineStr.length > 0) {
				if (newLineStr.charAt(0) === "'") {
					newLineStr =
						newLineStr.charAt(0) +
						newLineStr.charAt(1).toUpperCase() +
						newLineStr.slice(2);
				} else {
					newLineStr = newLineStr.charAt(0).toUpperCase() + newLineStr.slice(1);
				}
			}
			let newLine: LyricWord = {
				word: newLineStr,
				startTime: origLine.words[0].startTime,
				endTime: origLine.words[origLine.words.length - 1].endTime,
			};
			origLine.words.length = 0;
			origLine.words.push(newLine);
			console.log(newLineStr);
		}
	} else {
		for (const origLine of original) {
			const newWords: LyricWord[] = [];
			let prependWord: LyricWord | undefined = undefined;
			origLine.words.forEach((word, i) => {
				if (prependWord) {
					word.word = prependWord.word + word.word;
					word.startTime = Math.min(prependWord.startTime, word.startTime);
					prependWord = undefined;
				}
				if (IS_SYMBOLS.test(word.word)) {
					if (newWords.length > 0) {
						const lastNewWord = newWords[newWords.length - 1];
						lastNewWord.word += word.word;
						lastNewWord.endTime = Math.max(word.endTime, lastNewWord.endTime);
					} else {
						prependWord = {
							...word,
						};
					}
				} else {
					newWords.push(word);
				}
			});
			if (prependWord) {
				newWords.push(prependWord);
			}
			if (newWords.length > 0) {
				// 处理 newWords 中整句的第一个单词
				if (newWords[0].word.charAt(0) === "'") {
					newWords[0].word =
						newWords[0].word.charAt(0) +
						newWords[0].word.charAt(1).toUpperCase() +
						newWords[0].word.slice(2);
				} else {
					newWords[0].word =
						newWords[0].word.charAt(0).toUpperCase() +
						newWords[0].word.slice(1);
				}
			}
			origLine.words = newWords;
		}
	}
}

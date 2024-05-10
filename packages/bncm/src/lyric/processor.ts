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
	let hasBrackets = false;

	// 遍历原始歌词行
	for (const origLine of original) {
		// 检查当前歌词行中的单词是否包含括号
		if (origLine.words.some((word) => /[\(\)（）]/.test(word.word))) {
			hasBrackets = true;
			break; // 如果存在括号，立即跳出循环
		}
	}

	// 根据是否存在括号执行不同的逻辑
	if (hasBrackets) {
		for (const origLine of original) {
			let newLineStr = "";
			origLine.words.forEach((word, i) => {
				// 替换'（'为' ('
				word.word = word.word.replace("（", " (");
				// 替换'）'为') '
				word.word = word.word.replace("）", ") ");
				newLineStr += word.word;
			});
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
			// 合并单独作为标点符号的单词
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
			origLine.words = newWords;
		}
	}
}

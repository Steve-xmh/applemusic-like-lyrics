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

/**
 * 歌词后处理器，包括但不限于：
 *
 * - 合并单独的标点符号单词
 * - 合并时长不合法的单词
 */

import { LyricWord, LyricLine } from "@applemusic-like-lyrics/lyric";

const IS_SYMBOLS = /^[^a-zA-Z0-9\u4e00-\u9fa5]+$/u;

export function processLyric(original: LyricLine[]) {
	for (const origLine of original) {
		const newWords: LyricWord[] = [];
		let prependWord: LyricWord | undefined = undefined;
		origLine.words.forEach((word, i) => {
			if (prependWord) {
				word.word = prependWord.word + word.word;
				word.startTime = Math.min(prependWord.startTime, word.startTime);
				prependWord = undefined;
			}
			if (IS_SYMBOLS.test(word.word) || word.endTime - word.startTime <= 0) {
				if (newWords.length > 0) {
					const lastNewWord = newWords[newWords.length - 1];
					lastNewWord.word += word.word;
					lastNewWord.endTime = Math.max(word.endTime, lastNewWord.endTime);
				} else {
					prependWord = word;
				}
			} else {
				newWords.push(word);
			}
		});
		origLine.words = newWords;
	}
}

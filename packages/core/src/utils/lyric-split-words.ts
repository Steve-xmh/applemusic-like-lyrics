import type { LyricWord } from "../interfaces";

const CJKEXP = /^[\p{Unified_Ideograph}\u0800-\u9FFC]+$/u;

/**
 * 将输入的单词重新分组，之间没有空格的单词将会组合成一个单词数组
 *
 * 例如输入：`["Life", " ", "is", " a", " su", "gar so", "sweet"]`
 *
 * 应该返回：`["Life", " ", "is", " a", [" su", "gar"], "so", "sweet"]`
 * @param words 输入的单词数组
 * @returns 重新分组后的单词数组
 */
export function chunkAndSplitLyricWords(
	words: LyricWord[],
): (LyricWord | LyricWord[])[] {
	const resplitedWords: LyricWord[] = [];

	for (const w of words) {
		const realLength = w.word.replace(/\s/g, "").length;
		const splited = w.word.split(" ").filter((v) => v.trim().length > 0);
		if (splited.length > 1) {
			if (w.word.startsWith(" ")) {
				resplitedWords.push({
					word: " ",
					startTime: 0,
					endTime: 0,
				});
			}
			let charPos = 0;
			for (const s of splited) {
				const word: LyricWord = {
					word: s,
					startTime:
						w.startTime + (charPos / realLength) * (w.endTime - w.startTime),
					endTime:
						w.startTime +
						((charPos + s.length) / realLength) * (w.endTime - w.startTime),
				};
				resplitedWords.push(word);
				resplitedWords.push({
					word: " ",
					startTime: 0,
					endTime: 0,
				});
				charPos += s.length;
			}
			if (!w.word.endsWith(" ")) {
				resplitedWords.pop();
			}
		} else {
			resplitedWords.push({
				...w,
			});
		}
	}

	let wordChunk: string[] = [];
	let wChunk: LyricWord[] = [];
	const result: (LyricWord | LyricWord[])[] = [];

	for (const w of resplitedWords) {
		const word = w.word;
		wordChunk.push(word);
		wChunk.push(w);
		if (word.length > 0 && word.trim().length === 0) {
			wordChunk.pop();
			wChunk.pop();
			if (wChunk.length === 1) {
				result.push(wChunk[0]);
			} else if (wChunk.length > 1) {
				result.push(wChunk);
			}
			result.push(w);
			wordChunk = [];
			wChunk = [];
		} else if (
			!/^\s*[^\s]*\s*$/.test(wordChunk.join("")) ||
			CJKEXP.test(word)
		) {
			wordChunk.pop();
			wChunk.pop();
			if (wChunk.length === 1) {
				result.push(wChunk[0]);
			} else if (wChunk.length > 1) {
				result.push(wChunk);
			}
			wordChunk = [word];
			wChunk = [w];
		}
	}

	if (wChunk.length === 1) {
		result.push(wChunk[0]);
	} else {
		result.push(wChunk);
	}

	return result;
}

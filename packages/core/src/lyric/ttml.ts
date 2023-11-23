import { LyricLine, LyricWord } from "../interfaces";

const timeRegexp =
	/^(((?<hour>[0-9]+):)?(?<min>[0-9]+):)?(?<sec>[0-9]+([\.:]([0-9]+))?)/;
function parseTimespan(timeSpan: string): number {
	const matches = timeRegexp.exec(timeSpan);
	if (matches) {
		const hour = Number(matches.groups?.hour || "0");
		const min = Number(matches.groups?.min || "0");
		const sec = Number(matches.groups?.sec.replace(/:/, ".") || "0");
		return Math.floor((hour * 3600 + min * 60 + sec) * 1000);
	} else {
		throw new TypeError("时间戳字符串解析失败");
	}
}

export function parseTTML(ttmlText: string): LyricLine[] {
	const domParser = new DOMParser();
	const ttmlDoc: XMLDocument = domParser.parseFromString(
		ttmlText,
		"application/xml",
	);

	let mainAgentId = "v1";

	for (const agent of ttmlDoc.querySelectorAll("ttm\\:agent")) {
		if (agent.getAttribute("type") === "person") {
			const id = agent.getAttribute("xml:id");
			if (id) {
				mainAgentId = id;
			}
		}
	}

	const result: LyricLine[] = [];

	for (const lineEl of ttmlDoc.querySelectorAll("body p[begin][end]")) {
		const line: LyricLine = {
			words: [],
			startTime: parseTimespan(lineEl.getAttribute("begin") ?? "0:0"),
			endTime: parseTimespan(lineEl.getAttribute("end") ?? "0:0"),
			translatedLyric: "",
			romanLyric: "",
			isBG: false,
			isDuet: lineEl.getAttribute("ttm:agent") !== mainAgentId,
		};
		let curBGLine: LyricLine | null = null;

		for (const wordNode of lineEl.childNodes) {
			if (wordNode.nodeType === Node.TEXT_NODE) {
				const word = wordNode.textContent ?? "";
				if (/^(\s+)$/.test(word)) {
					line.words.push({
						word: " ",
						startTime: 0,
						endTime: 0,
					});
				} else {
					line.words.push({
						word: word,
						startTime: 0,
						endTime: 0,
					});
				}
			} else if (wordNode.nodeType === Node.ELEMENT_NODE) {
				const wordEl = wordNode as Element;
				const role = wordEl.getAttribute("ttm:role");

				if (wordEl.nodeName === "span" && role) {
					if (role === "x-bg") {
						const bgLine: LyricLine = {
							words: [],
							startTime: line.startTime,
							endTime: line.endTime,
							translatedLyric: "",
							romanLyric: "",
							isBG: true,
							isDuet: line.isDuet,
						};

						for (const wordNode of wordEl.childNodes) {
							if (wordNode.nodeType === Node.TEXT_NODE) {
								const word = wordNode.textContent ?? "";
								if (/^(\s+)$/.test(word)) {
									bgLine.words.push({
										word: " ",
										startTime: 0,
										endTime: 0,
									});
								} else {
									bgLine.words.push({
										word: word,
										startTime: 0,
										endTime: 0,
									});
								}
							} else if (wordNode.nodeType === Node.ELEMENT_NODE) {
								const wordEl = wordNode as Element;
								const role = wordEl.getAttribute("ttm:role");
								if (wordEl.nodeName === "span" && role) {
									if (role === "x-translation") {
										bgLine.translatedLyric = wordEl.innerHTML.trim();
									} else if (role === "x-roman") {
										bgLine.romanLyric = wordEl.innerHTML.trim();
									}
								} else if (
									wordEl.hasAttribute("begin") &&
									wordEl.hasAttribute("end")
								) {
									const word = {
										word: wordNode.textContent,
										startTime: parseTimespan(wordEl.getAttribute("begin")!!),
										endTime: parseTimespan(wordEl.getAttribute("end")!!),
									} as LyricWord;
									bgLine.words.push(word);
								}
							}
						}

						const firstWord = bgLine.words[0];
						bgLine.startTime = firstWord.startTime;
						if (firstWord?.word.startsWith("(")) {
							firstWord.word = firstWord.word.substring(1);
						}

						const lastWord = bgLine.words[bgLine.words.length - 1];
						bgLine.endTime = lastWord.endTime;
						if (lastWord?.word.endsWith(")")) {
							lastWord.word = lastWord.word.substring(
								0,
								lastWord.word.length - 1,
							);
						}

						curBGLine = bgLine;
					} else if (role === "x-translation") {
						line.translatedLyric = wordEl.innerHTML;
					} else if (role === "x-roman") {
						line.romanLyric = wordEl.innerHTML;
					}
				} else if (wordEl.hasAttribute("begin") && wordEl.hasAttribute("end")) {
					const word: LyricWord = {
						word: wordNode.textContent ?? "",
						startTime: parseTimespan(wordEl.getAttribute("begin")!!),
						endTime: parseTimespan(wordEl.getAttribute("end")!!),
					};
					line.words.push(word);
				}
			}
		}

		result.push(line);
		if (curBGLine) {
			// line.startTime = Math.min(line.startTime, curBGLine.startTime);
			// line.endTime = Math.max(line.endTime, curBGLine.endTime);
			// curBGLine.startTime = line.startTime;
			// curBGLine.endTime = line.endTime;
			result.push(curBGLine);
		}
	}

	return result;
}

/**
 * @fileoverview
 * 用于将内部歌词数组对象导出成 TTML 格式的模块
 * 但是可能会有信息会丢失
 */

import { LyricLine } from "./lyric-types";

function msToTimestamp(timeMS: number): string {
	const ms = timeMS % 1000;
	timeMS = (timeMS - ms) / 1000;
	const secs = timeMS % 60;
	timeMS = (timeMS - secs) / 60;
	const mins = timeMS % 60;
	const hrs = (timeMS - mins) / 60;

	if (hrs > 0) {
		return `${hrs}:${mins}:${secs}.${ms}`;
	} else if (mins > 0) {
		return `${mins}:${secs}.${ms}`;
	} else {
		return `${secs}.${ms}`;
	}
}

export default function exportTTMLText(lyric: LyricLine[]): string {
	const params: LyricLine[][] = [];

	let tmp: LyricLine[] = [];
	for (const line of lyric) {
		if (line.originalLyric.length === 0 && tmp.length > 0) {
			params.push(tmp);
			tmp = [];
		} else if (!line.isBackgroundLyric) {
			tmp.push(line);
		}
	}

	if (tmp.length > 0) {
		params.push(tmp);
	}

	const doc = new Document();

	const ttRoot = doc.createElement("tt");

	ttRoot.setAttribute("xmlns", "http://www.w3.org/ns/ttml");
	ttRoot.setAttribute("xmlns:ttm", "http://www.w3.org/ns/ttml#metadata");

	doc.appendChild(ttRoot);

	const head = doc.createElement("head");

	ttRoot.appendChild(head);

	const body = doc.createElement("body");

	const guessDuration =
		(lyric[lyric.length - 1]?.beginTime ?? 0) +
		(lyric[lyric.length - 1]?.duration ?? 0);
	body.setAttribute("dur", msToTimestamp(guessDuration));

	for (const param of params) {
		const paramDiv = doc.createElement("div");
		const beginTime = param[0]?.beginTime ?? 0;
		const endTime =
			(param[param.length - 1]?.beginTime ?? 0) +
			(param[param.length - 1]?.duration ?? 0);

		paramDiv.setAttribute("begin", msToTimestamp(beginTime));
		paramDiv.setAttribute("end", msToTimestamp(endTime));

		let i = 0;

		for (const line of param) {
			const lineP = doc.createElement("p");

			lineP.setAttribute("ttm:agent", line.shouldAlignRight ? "v1000" : "v1");
			lineP.setAttribute("itunes:key", `L${++i}`);

			if (line.dynamicLyric && line.dynamicLyricTime !== undefined) {
				for (const word of line.dynamicLyric) {
					const span = doc.createElement("span");
					span.setAttribute("begin", msToTimestamp(word.time));
					span.setAttribute("end", msToTimestamp(word.time + word.duration));
					span.appendChild(doc.createTextNode(word.word));
					lineP.appendChild(span);
				}
			} else {
				lineP.appendChild(doc.createTextNode(line.originalLyric));
			}

			if (line.backgroundLyric) {
				const bgLine = line.backgroundLyric;
				const bgLineSpan = doc.createElement("span");

				bgLineSpan.setAttribute(
					"ttm:agent",
					bgLine.shouldAlignRight ? "v1000" : "v1",
				);
				bgLineSpan.setAttribute("itunes:key", `L${++i}`);

				if (bgLine.dynamicLyric && bgLine.dynamicLyricTime !== undefined) {
					for (const word of bgLine.dynamicLyric) {
						const span = doc.createElement("span");
						span.setAttribute("begin", msToTimestamp(word.time));
						span.setAttribute("end", msToTimestamp(word.time + word.duration));
						span.appendChild(doc.createTextNode(word.word));
						bgLineSpan.appendChild(span);
					}
				} else {
					bgLineSpan.appendChild(doc.createTextNode(bgLine.originalLyric));
				}

				if (bgLine.translatedLyric) {
					const span = doc.createElement("span");
					span.setAttribute("ttm:role", "x-translation");
					span.setAttribute("xml:lang", "zh-CN");
					span.appendChild(doc.createTextNode(bgLine.translatedLyric));
					bgLineSpan.appendChild(span);
				}

				if (bgLine.romanLyric) {
					const span = doc.createElement("span");
					span.setAttribute("ttm:role", "x-roman");
					span.appendChild(doc.createTextNode(bgLine.romanLyric));
					bgLineSpan.appendChild(span);
				}

				lineP.appendChild(bgLineSpan);
			}

			if (line.translatedLyric) {
				const span = doc.createElement("span");
				span.setAttribute("ttm:role", "x-translation");
				span.setAttribute("xml:lang", "zh-CN");
				span.appendChild(doc.createTextNode(line.translatedLyric));
				lineP.appendChild(span);
			}

			if (line.romanLyric) {
				const span = doc.createElement("span");
				span.setAttribute("ttm:role", "x-roman");
				span.appendChild(doc.createTextNode(line.romanLyric));
				lineP.appendChild(span);
			}

			paramDiv.appendChild(lineP);
		}

		body.appendChild(paramDiv);
	}

	ttRoot.appendChild(body);

	return new XMLSerializer().serializeToString(doc);
}

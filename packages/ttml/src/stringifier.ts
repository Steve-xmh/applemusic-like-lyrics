/**
 * @fileoverview
 * 用于将内部歌词数组对象导出成 TTML 格式的模块
 * 但是可能会有信息会丢失
 */

import type { LyricLine } from "@applemusic-like-lyrics/core";

function msToTimestamp(timeMS: number): string {
	let time = timeMS;
	if (time === Infinity) {
		return "99:99.999";
	}
	time = time / 1000;
	const secs = time % 60;
	time = (time - secs) / 60;
	const mins = time % 60;
	const hrs = (time - mins) / 60;

	const h = hrs.toString().padStart(2, "0");
	const m = mins.toString().padStart(2, "0");
	const s = secs.toFixed(3).padStart(6, "0");

	if (hrs > 0) {
		return `${h}:${m}:${s}`;
	} else {
		return `${m}:${s}`;
	}
}

export function stringifyTTML(lyric: LyricLine[], pretty = false): string {
	const hasDuet = !!lyric.find((v) => v.isDuet);
	const isAllSingleLine = lyric.every((v) => v.words.length <= 1);
	const params: LyricLine[][] = [lyric];

	const doc = new Document();

	const ttRoot = doc.createElement("tt");

	ttRoot.setAttribute("xmlns", "http://www.w3.org/ns/ttml");
	ttRoot.setAttribute("xmlns:ttm", "http://www.w3.org/ns/ttml#metadata");
	ttRoot.setAttribute(
		"xmlns:itunes",
		"http://music.apple.com/lyric-ttml-internal",
	);

	doc.appendChild(ttRoot);

	const head = doc.createElement("head");

	ttRoot.appendChild(head);

	const body = doc.createElement("body");

	const metadata = doc.createElement("metadata");
	const mainPersonAgent = doc.createElement("ttm:agent");
	mainPersonAgent.setAttribute("type", "person");
	mainPersonAgent.setAttribute("xml:id", "v1");

	metadata.appendChild(mainPersonAgent);

	if (hasDuet) {
		const otherPersonAgent = doc.createElement("ttm:agent");
		otherPersonAgent.setAttribute("type", "other");
		otherPersonAgent.setAttribute("xml:id", "v2");

		metadata.appendChild(otherPersonAgent);
	}

	head.appendChild(metadata);

	const guessDuration =
		(lyric[lyric.length - 1]?.endTime ?? 0) - (lyric[0]?.startTime ?? 0);
	body.setAttribute("dur", msToTimestamp(guessDuration));

	let lastParam: HTMLParagraphElement | undefined = undefined;
	for (const param of params) {
		const paramDiv = doc.createElement("div");
		const startTime = param[0]?.startTime ?? 0;
		const endTime = param[param.length - 1]?.endTime ?? 0;

		paramDiv.setAttribute("begin", msToTimestamp(startTime));
		paramDiv.setAttribute("end", msToTimestamp(endTime));

		let i = 0;

		for (const line of param) {
			const lineP = doc.createElement("p");
			const beginTime = line.startTime ?? 0;
			const endTime = line.endTime;

			lineP.setAttribute("begin", msToTimestamp(beginTime));
			lineP.setAttribute("end", msToTimestamp(endTime));

			lineP.setAttribute("ttm:agent", line.isDuet ? "v2" : "v1");
			lineP.setAttribute("itunes:key", `L${++i}`);

			if (line.isBG) {
				const bgLine = line;
				const bgLineSpan = doc.createElement("span");
				bgLineSpan.setAttribute("ttm:role", "x-bg");

				if (isAllSingleLine) {
					bgLineSpan.appendChild(
						doc.createTextNode(bgLine.words.map((w) => w.word).join("")),
					);
				} else {
					let beginTime = 0;
					let endTime = 0;
					for (const word of bgLine.words) {
						if (word.word.trim().length === 0) {
							bgLineSpan.appendChild(doc.createTextNode(word.word));
						} else {
							const span = doc.createElement("span");
							span.setAttribute("begin", msToTimestamp(word.startTime));
							span.setAttribute("end", msToTimestamp(word.endTime));
							span.appendChild(doc.createTextNode(word.word));
							bgLineSpan.appendChild(span);
							beginTime = Math.min(beginTime, word.startTime);
							endTime = Math.max(endTime, word.endTime);
						}
					}
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
			} else {
				if (isAllSingleLine) {
					lineP.appendChild(
						doc.createTextNode(line.words.map((w) => w.word).join("")),
					);
				} else {
					let beginTime = Infinity;
					let endTime = 0;
					for (const word of line.words) {
						if (word.word.trim().length === 0) {
							lineP.appendChild(doc.createTextNode(word.word));
						} else {
							const span = doc.createElement("span");
							span.setAttribute("begin", msToTimestamp(word.startTime));
							span.setAttribute("end", msToTimestamp(word.endTime));
							span.appendChild(doc.createTextNode(word.word));
							lineP.appendChild(span);
							beginTime = Math.min(beginTime, word.startTime);
							endTime = Math.max(endTime, word.endTime);
						}
					}
					lineP.setAttribute("begin", msToTimestamp(beginTime));
					lineP.setAttribute("end", msToTimestamp(endTime));
				}
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

			if (line.isBG && lastParam) {
				if (lineP.firstElementChild)
					lastParam.appendChild(lineP.firstElementChild);
			} else {
				lastParam = lineP;
				paramDiv.appendChild(lineP);
			}
		}

		body.appendChild(paramDiv);
	}

	ttRoot.appendChild(body);

	if (pretty) {
		const xsltDoc = new DOMParser().parseFromString(
			[
				'<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
				'  <xsl:strip-space elements="*"/>',
				'  <xsl:template match="para[content-style][not(text())]">',
				'    <xsl:value-of select="normalize-space(.)"/>',
				"  </xsl:template>",
				'  <xsl:template match="node()|@*">',
				'    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
				"  </xsl:template>",
				'  <xsl:output indent="yes"/>',
				"</xsl:stylesheet>",
			].join("\n"),
			"application/xml",
		);

		const xsltProcessor = new XSLTProcessor();
		xsltProcessor.importStylesheet(xsltDoc);
		const resultDoc = xsltProcessor.transformToDocument(doc);

		return new XMLSerializer().serializeToString(resultDoc);
	} else {
		return new XMLSerializer().serializeToString(doc);
	}
}

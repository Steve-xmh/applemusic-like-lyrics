/**
 * @fileoverview
 * 用于将内部歌词数组对象导出成 TTML 格式的模块
 * 但是可能会有信息会丢失
 */

import type { LyricLine } from "./lyric-types";

function msToTimestamp(timeMS: number): string {
	if (timeMS === Infinity) {
		return "99:99.999";
	}
	timeMS = timeMS / 1000;
	const secs = timeMS % 60;
	timeMS = (timeMS - secs) / 60;
	const mins = timeMS % 60;
	const hrs = (timeMS - mins) / 60;
	
	const h = hrs.toString().padStart(2, "0");
	const m = mins.toString().padStart(2, "0");
	const s = secs.toFixed(3).padStart(6, "0");

	if (hrs > 0) {
		return `${h}:${m}:${s}`;
	} else {
		return `${m}:${s}`;
	}
}

export default function exportTTMLText(
	lyric: LyricLine[],
	pretty = false,
): string {
	const params: LyricLine[][] = [];

	let tmp: LyricLine[] = [];
	for (const line of lyric) {
		if (line.originalLyric.length === 0 && tmp.length > 0) {
			params.push(tmp);
			tmp = [];
		} else if (!line.isBackgroundLyric && line.originalLyric.length > 0) {
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
	ttRoot.setAttribute(
		"xmlns:itunes",
		"http://music.apple.com/lyric-ttml-internal",
	);

	doc.appendChild(ttRoot);

	const head = doc.createElement("head");

	ttRoot.appendChild(head);

	const body = doc.createElement("body");
	const hasOtherPerson = !!lyric.find((v) => v.shouldAlignRight);

	const metadata = doc.createElement("metadata");
	const mainPersonAgent = doc.createElement("ttm:agent");
	mainPersonAgent.setAttribute("type", "person");
	mainPersonAgent.setAttribute("xml:id", "v1");

	metadata.appendChild(mainPersonAgent);

	if (hasOtherPerson) {
		const otherPersonAgent = doc.createElement("ttm:agent");
		otherPersonAgent.setAttribute("type", "other");
		otherPersonAgent.setAttribute("xml:id", "v2");

		metadata.appendChild(otherPersonAgent);
	}

	head.appendChild(metadata);

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
			const beginTime = line.beginTime ?? 0;
			const endTime = line.beginTime + line.duration;

			lineP.setAttribute("begin", msToTimestamp(beginTime));
			lineP.setAttribute("end", msToTimestamp(endTime));

			lineP.setAttribute("ttm:agent", line.shouldAlignRight ? "v2" : "v1");
			lineP.setAttribute("itunes:key", `L${++i}`);

			if (line.dynamicLyric && line.dynamicLyricTime !== undefined) {
				for (const word of line.dynamicLyric) {
					const span = doc.createElement("span");
					span.setAttribute("begin", msToTimestamp(word.time));
					span.setAttribute("end", msToTimestamp(word.time + word.duration));
					span.appendChild(doc.createTextNode(word.word.trim()));
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
					bgLine.shouldAlignRight ? "v2" : "v1",
				);
				bgLineSpan.setAttribute("itunes:key", `L${++i}`);

				if (bgLine.dynamicLyric && bgLine.dynamicLyricTime !== undefined) {
					for (const word of bgLine.dynamicLyric) {
						const span = doc.createElement("span");
						span.setAttribute("begin", msToTimestamp(word.time));
						span.setAttribute("end", msToTimestamp(word.time + word.duration));
						span.appendChild(doc.createTextNode(word.word.trim()));
						bgLineSpan.appendChild(span);
					}
				} else {
					bgLineSpan.appendChild(
						doc.createTextNode(bgLine.originalLyric.trim()),
					);
				}

				if (bgLine.translatedLyric) {
					const span = doc.createElement("span");
					span.setAttribute("ttm:role", "x-translation");
					span.setAttribute("xml:lang", "zh-CN");
					span.appendChild(doc.createTextNode(bgLine.translatedLyric.trim()));
					bgLineSpan.appendChild(span);
				}

				if (bgLine.romanLyric) {
					const span = doc.createElement("span");
					span.setAttribute("ttm:role", "x-roman");
					span.appendChild(doc.createTextNode(bgLine.romanLyric.trim()));
					bgLineSpan.appendChild(span);
				}

				lineP.appendChild(bgLineSpan);
			}

			if (line.translatedLyric) {
				const span = doc.createElement("span");
				span.setAttribute("ttm:role", "x-translation");
				span.setAttribute("xml:lang", "zh-CN");
				span.appendChild(doc.createTextNode(line.translatedLyric.trim()));
				lineP.appendChild(span);
			}

			if (line.romanLyric) {
				const span = doc.createElement("span");
				span.setAttribute("ttm:role", "x-roman");
				span.appendChild(doc.createTextNode(line.romanLyric.trim()));
				lineP.appendChild(span);
			}

			paramDiv.appendChild(lineP);
		}

		body.appendChild(paramDiv);
	}

	ttRoot.appendChild(body);

	if (pretty) {
		var xsltDoc = new DOMParser().parseFromString(
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

		var xsltProcessor = new XSLTProcessor();
		xsltProcessor.importStylesheet(xsltDoc);
		var resultDoc = xsltProcessor.transformToDocument(doc);

		return new XMLSerializer().serializeToString(resultDoc);
	} else {
		return new XMLSerializer().serializeToString(doc);
	}
}

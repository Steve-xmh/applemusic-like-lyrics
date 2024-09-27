const WHITE_SPACE = /^\s+/;
const LATIN = /^[\p{L}0-9!"#$%&’()*+,-./:;<=>?@\[\]^_`\{|\}~]+/iu;

export interface TextLayoutResult {
	text: string;
	index: number;
	lineIndex: number;
	width: number;
	height: number;
	x: number;
}

export interface TextLayoutConfig {
	fontSize: number;
	maxWidth: number;
	lineHeight: number;
	/**
	 * 是否统一空格宽度，即不论空白字符有多少个，都只占用一个字符的宽度
	 */
	uniformSpace: boolean;
}

export interface TextLayoutFinalState {
	x: number;
	lineIndex: number;
}

/**
 * 对指定文本进行布局，返回每个字符的位置信息
 * 目前仅可支持普通拉丁字符和 CJK 字符
 * @param ctx 2D 画板上下文
 * @param text 文本
 * @param config 字体大小
 * @param initialX 初始 X 坐标，对于需要布局多段文本的情况下有所帮助
 */
export function* layoutWord(
	ctx: CanvasRenderingContext2D,
	text: string,
	config: TextLayoutConfig,
	initialX = 0,
): Generator<TextLayoutResult, TextLayoutFinalState, void> {
	if (import.meta.env.DEV) {
		if (!ctx) throw new Error("ctx is null");
		if (!(config.fontSize > 0)) throw new Error("fontSize is invalid");
	}

	let x = initialX;
	let lineIndex = 0;
	let lastWhitespaceIndex = 0;
	let curLayoutIndex = 0;
	let shouldWhitespace = false;
	let match: RegExpMatchArray | null = null;
	const spaceMetrics = ctx.measureText(" ");

	while (curLayoutIndex < text.length) {
		const rest = text.substring(curLayoutIndex);
		match = rest.match(WHITE_SPACE);
		if (match) {
			shouldWhitespace = true;
			lastWhitespaceIndex = curLayoutIndex;
			curLayoutIndex += match[0].length;
			continue;
		}
		// 拉丁文字应尽量保持连续而不在中间换行
		match = rest.match(LATIN);
		if (match) {
			curLayoutIndex += match[0].length;
			const text = match[0];
			const wholeMetrics = ctx.measureText(text);
			if (x + wholeMetrics.width > config.maxWidth) {
				// 在当前行放不下，换行
				x = 0;
				lineIndex++;
				shouldWhitespace = false;
			}
			if (shouldWhitespace) {
				shouldWhitespace = false;
				yield {
					text: " ",
					index: lastWhitespaceIndex,
					lineIndex,
					width: 0,
					height: config.fontSize,
					x,
				};
				x += spaceMetrics.width;
			}
			let prevChar = "";
			let lastMetrics: TextMetrics | null = null;
			for (const c of text) {
				const lastMergedMetrics = ctx.measureText(`${prevChar}${c}`);
				const metrics = ctx.measureText(c);
				if (prevChar !== "") {
					x = x + lastMergedMetrics.width - metrics.width;
				}
				if (x + metrics.width > config.maxWidth) {
					x = 0;
					lineIndex++;
				}
				yield {
					text: c,
					index: curLayoutIndex,
					lineIndex,
					width: metrics.width,
					height: config.fontSize,
					x,
				};
				prevChar = c;
				lastMetrics = metrics;
			}
			if (lastMetrics) x += lastMetrics.width;
			continue;
		}
		// 无需保持连续的字符，直接布局，推进游标
		{
			if (shouldWhitespace) {
				shouldWhitespace = false;
				yield {
					text: " ",
					index: lastWhitespaceIndex,
					lineIndex,
					width: 0,
					height: config.fontSize,
					x,
				};
				x += spaceMetrics.width;
			}
			const metrics = ctx.measureText(text[curLayoutIndex]);
			if (x + metrics.width > config.maxWidth) {
				x = 0;
				lineIndex++;
			}
			yield {
				text: text[curLayoutIndex],
				index: curLayoutIndex,
				lineIndex,
				width: metrics.width,
				height: config.fontSize,
				x,
			};
			x += metrics.width;
		}

		curLayoutIndex++;
	}

	return { x, lineIndex };
}

/**
 * 对指定文本进行布局，返回每段文字的位置信息
 * 目前仅可支持普通拉丁字符和 CJK 字符
 * @param ctx 2D 画板上下文
 * @param text 文本
 * @param config 字体大小
 * @param initialX 初始 X 坐标，对于需要布局多段文本的情况下有所帮助
 */
export function* layoutLine(
	ctx: CanvasRenderingContext2D,
	text: string,
	config: TextLayoutConfig,
	initialX = 0,
): Generator<TextLayoutResult, void, void> {
	let currentLine: TextLayoutResult = {
		text: "",
		index: 0,
		lineIndex: 0,
		width: 0,
		height: 0,
		x: 0,
	};

	for (const word of layoutWord(ctx, text, config, initialX)) {
		if (word.lineIndex !== currentLine.lineIndex) {
			if (currentLine.text.length) yield currentLine;
			currentLine = {
				...word,
			};
		} else {
			currentLine.text += word.text;
			currentLine.width = word.x + word.width;
		}
	}

	if (currentLine.text.length) yield currentLine;
}

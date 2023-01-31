/**
 * canvas-hypertext by Glide
 * https://github.com/glideapps/canvas-hypertxt
 */

const resultCache: Map<string, readonly string[]> = new Map();

// font -> avg pixels per char
const metrics: Map<string, { count: number; size: number }> = new Map();

const hyperMaps: Map<string, Map<string, number>> = new Map();

type BreakCallback = (str: string) => readonly number[];

export function clearMultilineCache() {
	resultCache.clear();
	hyperMaps.clear();
	metrics.clear();
}

export function backProp(
	text: string,
	realWidth: number,
	keyMap: Map<string, number>,
	temperature: number,
	avgSize: number,
) {
	let guessWidth = 0;
	const contribMap: Record<string, number> = {};
	for (const char of text) {
		const v = keyMap.get(char) ?? avgSize;
		guessWidth += v;
		contribMap[char] = (contribMap[char] ?? 0) + 1;
		("");
	}

	const diff = realWidth - guessWidth;

	for (const key of Object.keys(contribMap)) {
		const numContribution = contribMap[key];
		const contribWidth = keyMap.get(key) ?? avgSize;
		const contribAmount = (contribWidth * numContribution) / guessWidth;
		const adjustment = (diff * contribAmount * temperature) / numContribution;
		const newVal = contribWidth + adjustment;
		keyMap.set(key, newVal);
	}
}

function makeHyperMap(
	ctx: CanvasRenderingContext2D,
	avgSize: number,
): Map<string, number> {
	const result: Map<string, number> = new Map();
	let total = 0;
	for (const char of "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890,.-+=?") {
		const w = ctx.measureText(char).width;
		result.set(char, w);
		total += w;
	}

	const avg = total / result.size;

	// Artisnal hand-tuned constants that have no real meaning other than they make it work better for most fonts
	// These don't really need to be accurate, we are going to be adjusting the weights. It just converges faster
	// if they start somewhere close.
	const damper = 3;
	const scaler = (avgSize / avg + damper) / (damper + 1);
	const keys = result.keys();
	for (const key of keys) {
		result.set(key, (result.get(key) ?? avg) * scaler);
	}
	return result;
}

function measureText(
	ctx: CanvasRenderingContext2D,
	text: string,
	fontStyle: string,
	hyperMode: boolean,
): number {
	const current = metrics.get(fontStyle);

	if (hyperMode && current !== undefined && current.count > 20_000) {
		let hyperMap = hyperMaps.get(fontStyle);
		if (hyperMap === undefined) {
			hyperMap = makeHyperMap(ctx, current.size);
			hyperMaps.set(fontStyle, hyperMap);
		}

		if (current.count > 500_000) {
			let final = 0;
			for (const char of text) {
				final += hyperMap.get(char) ?? current.size;
			}
			return final * 1.01; //safety margin
		}

		const result = ctx.measureText(text);
		backProp(
			text,
			result.width,
			hyperMap,
			Math.max(0.05, 1 - current.count / 200_000),
			current.size,
		);
		metrics.set(fontStyle, {
			count: current.count + text.length,
			size: current.size,
		});
		return result.width;
	}

	const result = ctx.measureText(text);

	const avg = result.width / text.length;

	// we've collected enough data
	if ((current?.count ?? 0) > 20_000) {
		return result.width;
	}

	if (current === undefined) {
		metrics.set(fontStyle, {
			count: text.length,
			size: avg,
		});
	} else {
		const diff = avg - current.size;
		const contribution = text.length / (current.count + text.length);
		const newVal = current.size + diff * contribution;
		metrics.set(fontStyle, {
			count: current.count + text.length,
			size: newVal,
		});
	}

	return result.width;
}

function getSplitPoint(
	ctx: CanvasRenderingContext2D,
	text: string,
	width: number,
	fontStyle: string,
	totalWidth: number,
	measuredChars: number,
	hyperMode: boolean,
	getBreakOpportunities?: BreakCallback,
): number {
	if (text.length <= 1) return text.length;

	// this should never happen, but we are protecting anyway
	if (totalWidth < width) return -1;

	let guess = Math.floor((width / totalWidth) * measuredChars);
	let guessWidth = measureText(
		ctx,
		text.slice(0, Math.max(0, guess)),
		fontStyle,
		hyperMode,
	);

	const oppos = getBreakOpportunities?.(text);

	if (guessWidth === width) {
		// NAILED IT
	} else if (guessWidth < width) {
		while (guessWidth < width) {
			guess++;
			guessWidth = measureText(
				ctx,
				text.slice(0, Math.max(0, guess)),
				fontStyle,
				hyperMode,
			);
		}
		guess--;
	} else {
		// we only need to check for spaces as we go back
		while (guessWidth > width) {
			const lastSpace =
				oppos !== undefined ? 0 : text.lastIndexOf(" ", guess - 1);
			if (lastSpace > 0) {
				guess = lastSpace;
			} else {
				guess--;
			}
			guessWidth = measureText(
				ctx,
				text.slice(0, Math.max(0, guess)),
				fontStyle,
				hyperMode,
			);
		}
	}

	if (text[guess] !== " ") {
		let greedyBreak = 0;
		if (oppos === undefined) {
			greedyBreak = text.lastIndexOf(" ", guess);
		} else {
			for (const o of oppos) {
				if (o > guess) break;
				greedyBreak = o;
			}
		}
		if (greedyBreak > 0) {
			guess = greedyBreak;
		}
	}

	return guess;
}

// Algorithm improved from https://github.com/geongeorge/Canvas-Txt/blob/master/src/index.js
export function splitMultilineText(
	ctx: CanvasRenderingContext2D,
	value: string,
	fontStyle: string,
	width: number,
	hyperWrappingAllowed: boolean = false,
	getBreakOpportunities?: BreakCallback,
): readonly string[] {
	const key = `${value}_${fontStyle}_${width}px`;
	const cacheResult = resultCache.get(key);
	if (cacheResult !== undefined) return cacheResult;

	if (width <= 0) {
		// dont render 0 width stuff
		return [];
	}

	let result: string[] = [];
	const encodedLines: string[] = value.split("\n");

	const fontMetrics = metrics.get(fontStyle);
	// const safeLineGuess =
	// 	fontMetrics === undefined ? value.length : (width / fontMetrics.size) * 1.5;
	const safeLineGuess = value.length;
	const hyperMode =
		hyperWrappingAllowed &&
		fontMetrics !== undefined &&
		fontMetrics.count > 20_000;

	for (let line of encodedLines) {
		let textWidth = measureText(
			ctx,
			line.slice(0, Math.max(0, safeLineGuess)),
			fontStyle,
			hyperMode,
		);
		let measuredChars = Math.min(line.length, safeLineGuess);
		if (textWidth <= width) {
			// line fits, just push it
			result.push(line);
		} else {
			while (textWidth > width) {
				const splitPoint = getSplitPoint(
					ctx,
					line,
					width,
					fontStyle,
					textWidth,
					measuredChars,
					hyperMode,
					getBreakOpportunities,
				);
				const subLine = line.slice(0, Math.max(0, splitPoint));

				line = line.slice(subLine.length);
				result.push(subLine);
				textWidth = measureText(
					ctx,
					line.slice(0, Math.max(0, safeLineGuess)),
					fontStyle,
					hyperMode,
				);
				measuredChars = Math.min(line.length, safeLineGuess);
			}
			if (textWidth > 0) {
				result.push(line);
			}
		}
	}

	result = result.map((l, i) => (i === 0 ? l.trimEnd() : l.trim()));
	resultCache.set(key, result);
	if (resultCache.size > 500) {
		// this is not technically LRU behavior but it works "close enough" and is much cheaper
		resultCache.delete(resultCache.keys().next().value);
	}
	return result;
}

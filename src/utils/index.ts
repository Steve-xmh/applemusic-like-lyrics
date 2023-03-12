export function debounce<T extends Function>(callback: T, waitTime: number): T {
	let timer = 0;
	return function debounceClosure() {
		const self = this;
		// rome-ignore lint/style/noArguments: 防抖函数
		const args = arguments;
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(callback.bind(self, args), waitTime);
	} as unknown as T;
}

/* eslint-disable max-depth, max-statements, complexity, max-lines-per-function */
const SLASH = 47;
const DOT = 46;

const assertPath = (path: string) => {
	const t = typeof path;
	if (t !== "string") {
		throw new TypeError(`Expected a string, got a ${t}`);
	}
};

// this function is directly from node source
const posixNormalize = (path: string, allowAboveRoot: boolean) => {
	let res = "";
	let lastSegmentLength = 0;
	let lastSlash = -1;
	let dots = 0;
	let code: number | undefined;

	for (let i = 0; i <= path.length; ++i) {
		if (i < path.length) {
			code = path.charCodeAt(i);
		} else if (code === SLASH) {
			break;
		} else {
			code = SLASH;
		}
		if (code === SLASH) {
			if (lastSlash === i - 1 || dots === 1) {
				// NOOP
			} else if (lastSlash !== i - 1 && dots === 2) {
				if (
					res.length < 2 ||
					lastSegmentLength !== 2 ||
					res.charCodeAt(res.length - 1) !== DOT ||
					res.charCodeAt(res.length - 2) !== DOT
				) {
					if (res.length > 2) {
						const lastSlashIndex = res.lastIndexOf("/");
						if (lastSlashIndex !== res.length - 1) {
							if (lastSlashIndex === -1) {
								res = "";
								lastSegmentLength = 0;
							} else {
								res = res.slice(0, lastSlashIndex);
								lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
							}
							lastSlash = i;
							dots = 0;
							continue;
						}
					} else if (res.length === 2 || res.length === 1) {
						res = "";
						lastSegmentLength = 0;
						lastSlash = i;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					if (res.length > 0) {
						res += "/..";
					} else {
						res = "..";
					}
					lastSegmentLength = 2;
				}
			} else {
				if (res.length > 0) {
					res += `/${path.slice(lastSlash + 1, i)}`;
				} else {
					res = path.slice(lastSlash + 1, i);
				}
				lastSegmentLength = i - lastSlash - 1;
			}
			lastSlash = i;
			dots = 0;
		} else if (code === DOT && dots !== -1) {
			++dots;
		} else {
			dots = -1;
		}
	}

	return res;
};

const decode = (s: string) => {
	try {
		return decodeURIComponent(s);
	} catch {
		return s;
	}
};

export const normalizePath = (p: string) => {
	assertPath(p);

	let path = p.replaceAll("\\", "/");
	if (path.length === 0) {
		return ".";
	}

	const isAbsolute = path.charCodeAt(0) === SLASH;
	const trailingSeparator = path.charCodeAt(path.length - 1) === SLASH;

	path = decode(path);
	path = posixNormalize(path, !isAbsolute);

	if (path.length === 0 && !isAbsolute) {
		path = ".";
	}
	if (path.length > 0 && trailingSeparator) {
		path += "/";
	}
	if (isAbsolute) {
		return `/${path}`;
	}

	return path;
};

export function genRandomString(length: number) {
	const words = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	const result: string[] = [];
	for (let i = 0; i < length; i++) {
		result.push(words.charAt(Math.floor(Math.random() * words.length)));
	}
	return result.join("");
}

// 猜测歌词的阅读时间，大概根据中日英文简单计算，返回单位毫秒的阅读时间
export function guessTextReadDuration(text: string): number {
	const wordRegexp = /^([A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\-]+)$/;
	let wordCount = 0;
	// 以空格和各种标点符号分隔
	for (const word of text.split(
		/[ 　,，.。·、…？?"“”*&\^%\$#@!！\(\)（）\=\+_【】\[\]\{\}\/|]+/,
	)) {
		if (wordRegexp.test(word)) {
			wordCount++;
		} else {
			wordCount += word.length;
		}
	}
	return (wordCount / 400) * 60 * 1000;
}

export function drawImageProp(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement | OffscreenCanvas,
	x = 0,
	y = 0,
	w = ctx.canvas.width,
	h = ctx.canvas.height,
	offsetX = 0.5,
	offsetY = 0.5,
) {
	offsetX = typeof offsetX === "number" ? offsetX : 0.5;
	offsetY = typeof offsetY === "number" ? offsetY : 0.5;

	if (offsetX < 0) offsetX = 0;
	if (offsetY < 0) offsetY = 0;
	if (offsetX > 1) offsetX = 1;
	if (offsetY > 1) offsetY = 1;

	var iw = img.width;
	var ih = img.height;
	var r = Math.min(w / iw, h / ih);
	var nw = iw * r;
	var nh = ih * r;
	var cx: number;
	var cy: number;
	var cw: number;
	var ch: number;
	var ar = 1;

	if (nw < w) ar = w / nw;
	if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh; // updated
	nw *= ar;
	nh *= ar;

	cw = iw / (nw / w);
	ch = ih / (nh / h);

	cx = (iw - cw) * offsetX;
	cy = (ih - ch) * offsetY;

	if (cx < 0) cx = 0;
	if (cy < 0) cy = 0;
	if (cw > iw) cw = iw;
	if (ch > ih) ch = ih;

	// fill image in dest. rectangle
	ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

export function resizeImage(
	img: HTMLImageElement,
	width: number,
	height: number,
): ImageData {
	let canvas: HTMLCanvasElement | OffscreenCanvas;
	let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null;
	if (IS_WORKER || !APP_CONF.isOSX) {
		canvas = new OffscreenCanvas(width, height);
		ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
	} else {
		canvas = document.createElement("canvas");
		canvas.width = width;
		canvas.height = height;
		ctx = canvas.getContext("2d");
	}
	if (ctx) {
		ctx.drawImage(img, 0, 0, width, height);
		return ctx.getImageData(0, 0, width, height);
	} else {
		return new ImageData(1, 1);
	}
}

export enum PlayMode {
	Order = "type-order", // playonce
	Repeat = "type-repeat", // playorder
	One = "type-one", // playcycle
	Random = "type-random", // playrandom
}

export function switchPlayMode(playMode: PlayMode) {
	const playModeBtn = document.querySelector<HTMLDivElement>(".type.f-cp");
	while (playModeBtn) {
		if (playModeBtn.classList.contains(playMode)) {
			return;
		}
		playModeBtn.click();
	}
}

export function getCurrentPlayMode(): PlayMode | undefined {
	try {
		const setting = JSON.parse(
			localStorage.getItem("NM_SETTING_PLAYER") || "{}",
		);

		switch (setting?.mode) {
			case "playonce":
				return PlayMode.Order;
			case "playorder":
				return PlayMode.Repeat;
			case "playcycle":
				return PlayMode.One;
			case "playrandom":
				return PlayMode.Random;
			default:
		}
	} catch {}
	return undefined;
}

export const eqSet: <T>(xs: Set<T>, ys: Set<T>) => boolean = (
	xs,
	ys,
): boolean => xs.size === ys.size && [...xs].every((x) => ys.has(x));

export const IS_WORKER =
	typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;

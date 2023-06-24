import semverLt from "semver/functions/lt";
import { appStore } from "./page-injector/v3";
import { IS_WORKER } from "./is-worker";

let IS_NCMV3: boolean;
export function isNCMV3() {
	if (typeof IS_NCMV3 === "undefined") {
		try {
			IS_NCMV3 = !semverLt(
				APP_CONF.appver.split(".").slice(0, 3).join("."),
				"3.0.0",
			);
		} catch {
			try {
				IS_NCMV3 = !semverLt(
					betterncm.ncm.getNCMVersion().split(".").slice(0, 3).join("."),
					"3.0.0",
				);
			} catch {
				IS_NCMV3 = false;
			}
		}
	}
	return IS_NCMV3;
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
	Order = "type-order", // playonce 顺序播放
	Repeat = "type-repeat", // playorder 列表循环
	AI = "type-ai", // mode2 = true 心动模式
	One = "type-one", // playcycle 单曲循环
	Random = "type-random", // playrandom 随机播放
}

export function switchPlayMode(playMode: PlayMode) {
	if (isNCMV3()) {
		if (playMode === PlayMode.AI) return; // 3.0.0 暂时没有心动模式
		let counter = 0;
		while (counter++ < 4) {
			const playModeBtn = document.querySelector<HTMLButtonElement>(
				"footer > * > * > .middle > *:nth-child(1) > button:nth-child(1)",
			);
			const btnSpan = playModeBtn?.querySelector("span > span");
			if (!(playModeBtn && btnSpan)) break;
			playModeBtn.click();
			const playingMode = btnSpan.ariaLabel;
			console.log(btnSpan.ariaLabel);
			switch (playMode) {
				case PlayMode.Order:
					if (playingMode === "shuffle") return;
					break;
				case PlayMode.Repeat:
					if (playingMode === "order") return;
					break;
				case PlayMode.Random:
					if (playingMode === "singleloop") return;
					break;
				case PlayMode.One:
					if (playingMode === "loop") return;
					break;
			}
		}
	} else {
		const playModeBtn = document.querySelector<HTMLDivElement>(".type.f-cp");
		let counter = 0;
		while (playModeBtn && counter++ < 5) {
			if (playModeBtn.classList.contains(playMode)) {
				return;
			}
			playModeBtn.click();
		}
	}
}

export function getCurrentPlayMode(): PlayMode | undefined {
	try {
		if (isNCMV3()) {
			switch (appStore?.playingMode) {
				case "playOrder":
					return PlayMode.Order;
				case "playCycle":
					return PlayMode.Repeat;
				case "playRandom":
					return PlayMode.Random;
				case "playOneCycle":
					return PlayMode.One;
				default:
					return undefined;
			}
		} else {
			const setting = JSON.parse(
				localStorage.getItem("NM_SETTING_PLAYER") || "{}",
			);

			if (setting.mode2) {
				return PlayMode.AI;
			}

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
		}
	} catch {}
	return undefined;
}

export const eqSet: <T>(xs: Set<T>, ys: Set<T>) => boolean = (
	xs,
	ys,
): boolean => xs.size === ys.size && [...xs].every((x) => ys.has(x));

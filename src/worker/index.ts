import { Config, GLOBAL_CONFIG, setConfig } from "../config/core";
import { log, warn } from "../utils/logger";
import { genRandomString } from "../utils";
import { quantize } from "../libs/color-quantize";
import { Pixel } from "../libs/color-quantize/utils";
import { IS_WORKER } from "../utils/is-worker";
export let worker: Worker | undefined;

export let currentWorkerScript = "";
let workerBlob: string | undefined;
export function restartWorker(workerScript = currentWorkerScript) {
	currentWorkerScript = workerScript;
	if (workerBlob) {
		URL.revokeObjectURL(workerBlob);
	}
	workerBlob = URL.createObjectURL(
		new Blob([workerScript], {
			type: "application/javascript",
		}),
	);
	worker?.removeEventListener("message", onMainMessage);
	worker?.terminate();
	worker = new Worker(workerBlob, {
		name: "AMLL Worker",
		type: "classic",
	});
	setConfigFromMain(GLOBAL_CONFIG);
	worker.addEventListener("message", onMainMessage);
}

export const definedFunctions: {
	[funcName: string]: {
		funcName: string;
		funcBody: Function;
	};
} = {};
const callbacks = new Map<string, [Function, Function]>();

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
export function defineWorkerFunction<Args extends any[], Ret>(
	funcName: string,
	funcBody: (...args: Args) => Ret,
	transferArgIndexes: number[] = [],
): (...args: Args) => Promise<Ret> {
	definedFunctions[funcName] = {
		funcName,
		funcBody,
	};
	let callId = 0;
	return (...args: Args) => {
		if (worker) {
			return new Promise((resolve, reject) => {
				const id = `${genRandomString(4)} - ${funcName} - ${callId++}`;
				callbacks.set(id, [resolve, reject]);
				worker!!.postMessage(
					{
						id,
						funcName,
						args,
					} as WorkerCallMessage,
					transferArgIndexes.map((i) => args[i]).filter((v) => !!v),
				);
			});
		} else {
			// Worker 尚未运行，在本地线程执行
			if (!APP_CONF.isOSX)
				warn("AMLL Worker 尚未运行，正在本地线程执行函数", funcName, args);
			try {
				const result = funcBody(...args);
				return Promise.resolve(result);
			} catch (err) {
				return Promise.reject(err);
			}
		}
	};
}

export interface WorkerCallMessage {
	id: string;
	funcName: string;
	args: unknown[];
}

export interface WorkerResultMessage {
	id: string;
	result: unknown;
	error?: Error;
}
export const grabImageColors = defineWorkerFunction(
	"grabImageColors",
	(img: ImageBitmap, maxColors = 16) => {
		let canvas: HTMLCanvasElement | OffscreenCanvas;
		let ctx:
			| CanvasRenderingContext2D
			| OffscreenCanvasRenderingContext2D
			| null;
		if (IS_WORKER || !APP_CONF.isOSX) {
			canvas = new OffscreenCanvas(img.width, img.height);
			ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
		} else {
			canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			ctx = canvas.getContext("2d");
		}
		if (ctx) {
			ctx.drawImage(img, 0, 0);
			const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const pixels: Pixel[] = [];
			for (let i = 0; i < data.width * data.height; i++) {
				pixels.push([
					data.data[i * 4],
					data.data[i * 4 + 1],
					data.data[i * 4 + 2],
				]);
			}
			const result = quantize(pixels, maxColors);
			const colors: Pixel[] = [];
			result.palette().forEach((color) => colors.push(color));
			return colors;
		} else {
			return [];
		}
	},
);
export const calcImageAverageColor = defineWorkerFunction(
	"calcImageAverageColor",
	(img: ImageBitmap): Pixel => {
		let canvas: HTMLCanvasElement | OffscreenCanvas;
		let ctx:
			| CanvasRenderingContext2D
			| OffscreenCanvasRenderingContext2D
			| null;
		if (IS_WORKER || !APP_CONF.isOSX) {
			canvas = new OffscreenCanvas(img.width, img.height);
			ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
		} else {
			canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			ctx = canvas.getContext("2d");
		}
		if (ctx) {
			ctx.drawImage(img, 0, 0);
			const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
			const avgColor: Pixel = [0, 0, 0];
			for (let i = 0; i < data.width * data.height; i++) {
				avgColor[0] += data.data[i * 4];
				avgColor[1] += data.data[i * 4 + 1];
				avgColor[2] += data.data[i * 4 + 2];
			}
			avgColor[0] /= data.width * data.height;
			avgColor[1] /= data.width * data.height;
			avgColor[2] /= data.width * data.height;
			return avgColor;
		} else {
			return [0, 0, 0];
		}
	},
);

export const setConfigFromMain = defineWorkerFunction(
	"setConfigFromMain",
	(config: Partial<Config>) => {
		if (IS_WORKER) {
			for (const key in config) {
				setConfig(key, config[key]);
			}
			log("已从主线程同步配置", ...Object.keys(config));
		}
	},
);

export function onMainMessage(evt: MessageEvent<WorkerResultMessage>) {
	const data = callbacks.get(evt.data.id);
	if (data) {
		const [resolve, reject] = data;
		callbacks.delete(evt.data.id);
		if (evt.data.error) {
			reject(evt.data.error);
		} else {
			resolve(evt.data.result);
		}
	}
}

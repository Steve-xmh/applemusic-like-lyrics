import { Config, GLOBAL_CONFIG, setConfig } from "../config/core";
import { log, warn } from "../utils/logger";
import { IS_WORKER, genRandomString } from "../utils";
import { quantize } from "./color-quantize";
import { Pixel } from "./color-quantize/utils";
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
	async (img: ImageBitmap, maxColors = 16) => {
		const canvas = new OffscreenCanvas(img.width, img.height);
		const ctx: OffscreenCanvasRenderingContext2D = canvas.getContext(
			"2d",
		) as unknown as OffscreenCanvasRenderingContext2D;
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

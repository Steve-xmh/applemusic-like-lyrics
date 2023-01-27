import { getConfig, setConfig } from "../config/core";
import { GLOBAL_EVENTS } from "../utils/global-events";
import { log, warn } from "../utils/logger";
import { genRandomString } from "../utils";
const cachedFunctionMap: Map<string, Function> = new Map();

export const settingPrefix = "applemusic-like-lyrics:";

export enum PlayState {
	Playing = 1,
	Pausing = 2,
}

export const NCM_IMAGE_CDNS = [
	"https://p3.music.126.net/",
	"https://p4.music.126.net/",
];
let selectIndex = 0;
export function getNCMImageUrl(id: number | string) {
	selectIndex++;
	selectIndex %= NCM_IMAGE_CDNS.length;
	if (APP_CONF.isOSX) {
		return `${NCM_IMAGE_CDNS[selectIndex]}${callCachedSearchFunction(
			"R$nameDo",
			["encryptId", id.toString()],
		)}/${id}.jpg`;
	} else {
		return `${NCM_IMAGE_CDNS[selectIndex]}${channel.encryptId(
			id.toString(),
		)}/${id}.jpg`;
	}
}

export interface EAPIRequestConfig {
	/**
	 * 返回响应的数据类型，绝大部分情况下都是 `json`
	 */
	type: string;
	// rome-ignore lint/suspicious/noExplicitAny: 该对象可以是任何序列化成 JSON 的对象
	data?: any;
	method?: string;
	// rome-ignore lint/suspicious/noExplicitAny: 该对象可以是任何序列化成 URI 请求字符串的对象
	query?: { [param: string]: any };
	onload?: Function;
	onerror?: Function;
	oncallback?: Function;
}

/**
 * 调用网易云自己的加密请求函数，获取相应的信息
 * @param url 请求的链接，通常是 `APP_CONF.domain + 路径`
 * @param config 请求的参数
 * @todo 确认兼容版本范围内的函数名是否可用
 */
export function eapiRequest(url: string, config: EAPIRequestConfig) {
	return callCachedSearchFunction(checkEapiRequestFuncName(), [url, config]); // 经测试 2.10.6 可用
}

export function checkEapiRequestFuncName(): string {
	let funcName = getConfig("eapiRequestFuncName", "");
	log("加密请求函数", funcName);
	const ncmPackageVersion = getConfig("ncmPackageVersion", "");
	if (ncmPackageVersion !== APP_CONF.packageVersion) {
		funcName = "";
		setConfig("ncmPackageVersion", APP_CONF.packageVersion);
	}
	if (funcName === "") {
		funcName = tryFindEapiRequestFuncName() || "";
		if (funcName === "") {
			funcName = tryFindEapiRequestFuncName(true) || "";
		}
		setConfig("eapiRequestFuncName", funcName);
		GLOBAL_EVENTS.dispatchEvent(
			new Event("config-changed-eapiRequestFuncName"),
		);
	}
	return funcName;
}

try {
	checkEapiRequestFuncName(); // 触发一次检查请求函数名字
} catch {}

export interface SongDetailResponse {
	songs: {
		al: {
			id: number;
			name: string;
			pic: number;
			picUrl: string;
			pic_str: string;
		};
		ar: {
			id: number;
			name: string;
		}[];
		name: string;
	}[];
}

export function getSongDetail(...songIds: number[]) {
	return new Promise<SongDetailResponse>((resolve, reject) => {
		eapiRequest(`${APP_CONF.domain}/api/v3/song/detail`, {
			type: "json",
			data: {
				c: JSON.stringify(songIds.map((id) => ({ id }))),
			},
			onload: resolve,
			onerror: reject,
		});
	});
}

export interface ListenTogetherStatus {
	code: number;
	data: {
		inRoom: false;
		roomInfo: {
			creatorId: number;
			roomId: string;
			effectiveDurationMs: number;
			waitMs: number;
			roomCreateTime: number;
			chatRoomId: string;
			agoraChannelId: string;
			roomUsers: {
				userId: number;
				nickname: string;
				avatarUrl: string;
				identityIcon?: string;
				identityName?: string;
			}[];
			roomRTCType: number;
			roomType: "FRIEND" | string;
			matchedReason: string | null;
			alg: string | null;
			unlockIdentityNeededMs: number | null;
			unlockedIdentity: string | null;
			unlockTextChatNeededMs: number | null;
			ltType: number | null;
			openHeartRcmd: boolean | null;
			roomVipAbGroup: {};
		} | null;
		status: "NOT_CONNECTED" | "CONNECTED" | null;
		anotherDeviceInfo: {
			antherUserId: number;
			osType: string;
			appVersion: string;
		} | null;
	};
	message: string;
}

export function getListenTogetherStatus() {
	return new Promise<ListenTogetherStatus>((resolve, reject) => {
		eapiRequest(`${APP_CONF.domain}/api/listen/together/status/get`, {
			type: "json",
			onload: resolve,
			onerror: reject,
		});
	});
}

export function tryFindEapiRequestFuncName(
	unsafe: boolean = false,
): string | null {
	// 为了避免自身被搜索到，就把字符串拆开来组合了
	const keyword1 = ["_bindTokenRequest", "yidun", "getToken", "undefined"];
	const keyword2 = ["/api", "register", "anonimous"];
	const result = betterncm.ncm.findApiFunction(
		(v) =>
			(v.toString().includes(keyword1.join(" ")) ||
				v.toString().includes(keyword2.join("/"))) &&
			v !== tryFindEapiRequestFuncName,
	);
	if (result) {
		for (const key in result[1]) {
			if (result[1][key] === result[0]) {
				log("查找到原始请求函数：", key, result);
				const originalFuncName = key;
				if (unsafe) return originalFuncName;
				for (const key in result[1]) {
					if (
						result[1][key]?.originalFunc
							?.toString()
							?.includes(`.${originalFuncName}(`)
					) {
						log("查找到绑定请求函数：", key, result);
						return key;
					}
				}
			}
		}
	}
	log("查找请求函数失败");
	return null;
}

// rome-ignore lint/suspicious/noExplicitAny: 函数类型可随意
export function callCachedSearchFunction<F extends (...args: any[]) => any>(
	searchFunctionName: string | ((func: Function) => boolean),
	args: Parameters<F>,
): ReturnType<F> {
	if (!cachedFunctionMap.has(searchFunctionName.toString())) {
		const findResult = betterncm.ncm.findApiFunction(searchFunctionName);
		if (findResult) {
			const [func, funcRoot] = findResult;
			cachedFunctionMap.set(searchFunctionName.toString(), func.bind(funcRoot));
		}
	}
	const cachedFunc = cachedFunctionMap.get(searchFunctionName.toString());
	if (cachedFunc) {
		return cachedFunc.apply(null, args);
	} else {
		throw new TypeError(`函数 ${searchFunctionName.toString()} 未找到`);
	}
}

/**
 * 根据歌曲 ID 获取歌词数据信息
 * @param songId 歌曲ID
 * @returns 歌词数据信息
 */
export function getLyric(songId: number): Promise<EAPILyricResponse> {
	// 参考
	// orpheus://orpheus/pub/core.e5842f1.js?d7496bf6377403c83793c37f6fbf0300:formatted:27946
	// orpheus://orpheus/pub/core.e5842f1.js?d7496bf6377403c83793c37f6fbf0300:formatted:27424
	return new Promise((resolve, reject) => {
		eapiRequest(`${APP_CONF.domain}/api/song/lyric/v1`, {
			type: "json",
			query: {
				id: songId,
				cp: false,
				tv: 0,
				lv: 0,
				rv: 0,
				kv: 0,
				yv: 0,
				ytv: 0,
				yrv: 0,
			},
			onload: resolve,
			onerror: reject,
		});
	});
}

/**
 * 根据歌曲 ID 获取歌曲文件下载链接
 * @param songId 歌曲ID
 * @param byterate 音质码率，默认最高
 * @returns 歌词数据信息
 */
export function getMusicURL(
	songId: number,
	byterate: number = 999000,
): Promise<EAPILyricResponse> {
	// 参考
	// orpheus://orpheus/pub/core.e5842f1.js?d7496bf6377403c83793c37f6fbf0300:formatted:27946
	// orpheus://orpheus/pub/core.e5842f1.js?d7496bf6377403c83793c37f6fbf0300:formatted:27424
	return new Promise((resolve, reject) => {
		eapiRequest(`${APP_CONF.domain}/api/song/enhance/download/url`, {
			method: "POST",
			type: "json",
			data: {
				id: songId,
				br: byterate,
			},
			onload: resolve,
			onerror: reject,
		});
	});
}

/**
 * 根据歌曲 ID 获取歌词数据信息
 * @param songId 歌曲ID
 * @returns 歌词数据信息
 */
export function getLyricCorrection(songId: number): Promise<EAPILyricResponse> {
	// 参考
	// orpheus://orpheus/pub/core.e5842f1.js?d7496bf6377403c83793c37f6fbf0300:formatted:27946
	// orpheus://orpheus/pub/core.e5842f1.js?d7496bf6377403c83793c37f6fbf0300:formatted:27424
	return new Promise((resolve, reject) => {
		eapiRequest(`${APP_CONF.domain}/api/song/web/lyric/correction`, {
			type: "json",
			query: {
				id: songId,
			},
			onload: resolve,
			onerror: reject,
		});
	});
}

/**
 * 获取当前正在播放的歌曲的信息，包括歌曲信息，来源，当前播放状态等
 * @todo 补全返回值类型
 * @returns 当前歌曲的播放信息
 */
export function getPlayingSong() {
	return loadedPlugins.libsonginfo.getPlaying();
}

export interface LyricFileEntry {
	version: number;
	lyric: string;
}

export interface LyricFile {
	lrc?: LyricFileEntry;
	klyric?: LyricFileEntry;
	tlyric?: LyricFileEntry;
	romalrc?: LyricFileEntry;
	yrc?: LyricFileEntry;
	yromalrc?: LyricFileEntry;
	ytlrc?: LyricFileEntry;
}

export const loadLyric = async (id: string | number): Promise<LyricFile> => {
	const lyricsPath = `${plugin.pluginPath}/lyrics`;
	const cachedLyricPath = `${lyricsPath}/${id}.json`;
	try {
		if (await betterncm.fs.exists(cachedLyricPath)) {
			const cachedLyricData = await betterncm.fs.readFileText(cachedLyricPath);
			return JSON.parse(cachedLyricData);
		}
	} catch (err) {
		warn("警告：加载已缓存歌词失败", err);
	}
	if (typeof id === "number") {
		const data = await getLyric(id);
		try {
			if (!(await betterncm.fs.exists(lyricsPath))) {
				betterncm.fs.mkdir(lyricsPath);
			}
			await betterncm.fs.writeFile(
				cachedLyricPath,
				JSON.stringify(data, null, 4),
			);
		} catch (err) {
			warn("警告：缓存歌词失败", err);
		}
		return data;
	} else {
		// 如果是摘要字符串的话，那就是本地文件
		return {};
	}
};

export function genAudioPlayerCommand(audioId: string, command: string) {
	return `${audioId}|${command}|${genRandomString(6)}`;
}

export function classname(
	...classes: (string | { [className: string]: boolean })[]
): string {
	let result: string[] = [];
	for (const arg of classes) {
		if (typeof arg === "string") {
			const className = arg.trim();
			if (!result.includes(className)) result.push(className);
		} else {
			for (const key in arg) {
				if (arg[key]) {
					const className = key.trim();
					if (!result.includes(className)) result.push(className);
				}
			}
		}
	}
	return result.join(" ");
}

export async function genBitmapImage(imageUrl: string) {
	const img = new Image();
	img.src = imageUrl;
	await img.decode();
	const canvas = new OffscreenCanvas(img.width, img.height);
	const ctx: OffscreenCanvasRenderingContext2D = canvas.getContext(
		"2d",
	) as unknown as OffscreenCanvasRenderingContext2D;
	if (ctx) {
		ctx.drawImage(img, 0, 0);
		return canvas.transferToImageBitmap();
	}
}

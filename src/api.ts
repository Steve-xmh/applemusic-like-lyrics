import * as React from "react";
import { getConfig, setConfig } from "./config/core";
import { GLOBAL_EVENTS } from "./global-events";
import { log } from "./logger";
import { version } from "../manifest.json";
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
	return `${NCM_IMAGE_CDNS[selectIndex]}${channel.encryptId(
		id.toString(),
	)}/${id}.jpg`;
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
	const result = betterncm.ncm.findApiFunction((v) =>
		v.toString().includes("_bindTokenRequest yidun getToken undefined"),
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
function callCachedSearchFunction<F extends (...args: any[]) => any>(
	searchFunctionName: string,
	args: Parameters<F>,
): ReturnType<F> {
	if (!cachedFunctionMap.has(searchFunctionName)) {
		const findResult = betterncm.ncm.findApiFunction(searchFunctionName);
		if (findResult) {
			const [func, funcRoot] = findResult;
			cachedFunctionMap.set(searchFunctionName, func.bind(funcRoot));
		}
	}
	const cachedFunc = cachedFunctionMap.get(searchFunctionName);
	if (cachedFunc) {
		return cachedFunc.apply(null, args);
	} else {
		throw new TypeError(`函数 ${searchFunctionName} 未找到`);
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
	return callCachedSearchFunction("getPlaying", []);
}

function genRandomString(length: number) {
	const words = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	const result: string[] = [];
	for (let i = 0; i < length; i++) {
		result.push(words.charAt(Math.floor(Math.random() * words.length)));
	}
	return result.join("");
}

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

export function useConfig(
	key: string,
	defaultValue: string,
): [string, React.Dispatch<string>];
export function useConfig(
	key: string,
	defaultValue?: string,
): [string | undefined, React.Dispatch<string | undefined>];
export function useConfig(
	key: string,
	defaultValue?: string,
): [string | undefined, React.Dispatch<string | undefined>] {
	const [value, setValue] = React.useState(
		getConfig(key, defaultValue) || defaultValue,
	);
	const eventKey = React.useMemo(() => `config-changed-${key}`, [key]);
	React.useEffect(() => {
		setConfig(key, value);
		GLOBAL_EVENTS.dispatchEvent(new Event(eventKey));
	}, [value]);
	React.useEffect(() => {
		const onConfigUpdate = () => {
			const newValue = getConfig(key, defaultValue) || defaultValue;
			setValue(newValue);
		};
		GLOBAL_EVENTS.addEventListener(eventKey, onConfigUpdate);
		return () => {
			GLOBAL_EVENTS.removeEventListener(eventKey, onConfigUpdate);
		};
	}, [key, defaultValue, eventKey]);
	return [value, setValue];
}

export function useNowPlayingOpened(): boolean {
	const [value, setValue] = React.useState(
		!!document.getElementById("applemusic-like-lyrics-view"),
	);
	React.useEffect(() => {
		setValue(!!document.getElementById("applemusic-like-lyrics-view"));
		log(
			"applemusic-like-lyrics-view",
			value,
			!!document.getElementById("applemusic-like-lyrics-view"),
		);
		const onLyricPageOpen = () => {
			log("歌词页面已显示");
			setValue(true);
		};
		const onLyricPageHide = () => {
			log("歌词页面已隐藏");
			setValue(false);
		};
		GLOBAL_EVENTS.addEventListener("lyric-page-open", onLyricPageOpen);
		GLOBAL_EVENTS.addEventListener("lyric-page-hide", onLyricPageHide);
		return () => {
			GLOBAL_EVENTS.removeEventListener("lyric-page-open", onLyricPageOpen);
			GLOBAL_EVENTS.removeEventListener("lyric-page-hide", onLyricPageHide);
		};
	}, []);

	return value;
}

let cachedLatestVersion: string | undefined;

export async function checkGithubLatestVersion(force = false): Promise<string> {
	// https://ghproxy.com/https://raw.githubusercontent.com/Steve-xmh/applemusic-like-lyrics/main/dist/manifest.json
	// https://raw.githubusercontent.com/Steve-xmh/applemusic-like-lyrics/main/dist/manifest.json

	if (force) {
		cachedLatestVersion = undefined;
	}

	if (cachedLatestVersion !== undefined) {
		return cachedLatestVersion;
	}

	const GITHUB_DIST_MANIFEST_URL =
		"https://raw.githubusercontent.com/Steve-xmh/applemusic-like-lyrics/main/dist/manifest.json";

	try {
		const manifest = (await (
			await fetch(`https://ghproxy.com/${GITHUB_DIST_MANIFEST_URL}`)
		).json()) as typeof import("../dist/manifest.json");
		if (cachedLatestVersion !== manifest.version) {
			GLOBAL_EVENTS.dispatchEvent(new Event("latest-version-updated"));
		}
		cachedLatestVersion = manifest.version;
		return cachedLatestVersion;
	} catch {}

	try {
		const manifest = (await (
			await fetch(GITHUB_DIST_MANIFEST_URL)
		).json()) as typeof import("../dist/manifest.json");
		if (cachedLatestVersion !== manifest.version) {
			GLOBAL_EVENTS.dispatchEvent(new Event("latest-version-updated"));
		}
		cachedLatestVersion = manifest.version;
		return cachedLatestVersion;
	} catch {}

	return cachedLatestVersion || "";
}

export function useGithubLatestVersion(): string {
	const [version, setVersion] = React.useState("");

	React.useEffect(() => {
		const checkUpdate = () => checkGithubLatestVersion().then(setVersion);
		checkUpdate();
		GLOBAL_EVENTS.addEventListener("latest-version-updated", checkUpdate);
		return () => {
			GLOBAL_EVENTS.removeEventListener("latest-version-updated", checkUpdate);
		};
	}, []);

	return version;
}

export function useHasUpdates(): boolean {
	const githubVersion = useGithubLatestVersion();
	return React.useMemo(
		() => githubVersion !== "" && githubVersion !== version,
		[githubVersion],
	);
}

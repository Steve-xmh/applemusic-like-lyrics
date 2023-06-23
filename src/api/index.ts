import { log, warn } from "../utils/logger";
import { isNCMV3 } from "../utils";
import type { LyricLine } from "../core/lyric-types";
import { parseLyric as parseTTMLLyric } from "../core/ttml-lyric-parser";
import { songInfoPayload } from "../utils/page-injector/v3";
import { genRandomString } from "../utils/gen-random-string";
import { normalizePath } from "../utils/path";
let cachedFunctionMap: Map<string, Function> = new Map();

export enum PlayState {
	Playing = "playing",
	Pausing = "pausing",
}

export enum AudioQualityType {
	// 128
	Normal = "normal",
	// 320
	High = "high",
	// 999
	Lossless = "lossless",
	// 1999
	HiRes = "hires",
	DolbyAtmos = "dolbyatmos",
	Local = "local",
}

export function toPlayState(enumId: number): PlayState {
	if (enumId === 1) {
		return PlayState.Pausing;
	} else if (enumId === 2) {
		return PlayState.Playing;
	} else {
		throw new TypeError(`未知的播放状态值 ${enumId}`);
	}
}

// rome-ignore lint/suspicious/noExplicitAny: 函数类型可随意
export function callCachedSearchFunction<F extends (...args: any[]) => any,>(
	searchFunctionName: string | ((func: Function) => boolean),
	args: Parameters<F>,
): ReturnType<F> {
	cachedFunctionMap ??= new Map(); // 很神奇，不知道为什么此处会炸
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

export async function getSongDetail(
	...songIds: number[]
): Promise<SongDetailResponse> {
	const v = await fetch(
		`${APP_CONF.domain}/api/v3/song/detail?c=${encodeURIComponent(
			JSON.stringify(songIds.map((id) => ({ id }))),
		)}`,
	);
	return await v.json();
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

export async function getListenTogetherStatus(): Promise<ListenTogetherStatus> {
	const v = await fetch(`${APP_CONF.domain}/api/listen/together/status/get`);
	return await v.json();
}

/**
 * 根据歌曲 ID 获取歌词数据信息
 * @param songId 歌曲ID
 * @returns 歌词数据信息
 */
export async function getLyric(songId: number): Promise<EAPILyricResponse> {
	const v = await fetch(
		`${APP_CONF.domain}/api/song/lyric/v1?tv=0&lv=0&rv=0&kv=0&yv=0&ytv=0&yrv=0&cp=false&id=${songId}`,
	);
	return await v.json();
}

/**
 * 根据歌曲 ID 获取歌词数据信息
 * @param songId 歌曲ID
 * @returns 歌词数据信息
 */
export async function getLyricCorrection(
	songId: number,
): Promise<EAPILyricResponse> {
	const v = await fetch(
		`${APP_CONF.domain}/api/song/web/lyric/correction?id=${songId}`,
	);
	return await v.json();
}

/**
 * 获取当前正在播放的歌曲的信息，包括歌曲信息，来源，当前播放状态等
 * @todo 补全返回值类型
 * @returns 当前歌曲的播放信息
 */
export function getPlayingSong() {
	if (isNCMV3()) {
		return {
			state: songInfoPayload?.playingState ?? 2,
			data: songInfoPayload?.trackIn?.track,
		};
	} else if (APP_CONF.isOSX) {
		return callCachedSearchFunction("baD", []);
	} else {
		return callCachedSearchFunction("getPlaying", []);
	}
}

export interface LyricFileEntry {
	version: number;
	lyric: string;
}

export interface LyricAuthorUser {
	id: number;
	status: number;
	demand: number;
	userid: number;
	nickname: string;
	uptime: number;
}

export interface LyricFile {
	lrc?: LyricFileEntry;
	klyric?: LyricFileEntry;
	tlyric?: LyricFileEntry;
	romalrc?: LyricFileEntry;
	yrc?: LyricFileEntry;
	yromalrc?: LyricFileEntry;
	ytlrc?: LyricFileEntry;
	lyricUser?: LyricAuthorUser;
	transUser?: LyricAuthorUser;

	// AMLL 特供
	lyricOffset?: number;
	albumImageUrl?: string;
}

export const getLyricCachePath = () =>
	normalizePath(`${plugin.pluginPath}/../../amll-data/lyrics`);

export const loadLyric = async (
	id: string | number,
	ignoreCache = false,
): Promise<LyricFile> => {
	const lyricsPath = getLyricCachePath();
	const cachedLyricPath = `${lyricsPath}/${id}.json`;
	log("正在加载歌词", id, typeof id);
	log("歌词文件夹路径", lyricsPath);
	log("歌词文件路径", cachedLyricPath);
	try {
		if (!ignoreCache && (await betterncm.fs.exists(cachedLyricPath))) {
			log("发现歌词缓存，正在加载缓存", cachedLyricPath);
			const cachedLyricData = await betterncm.fs.readFileText(cachedLyricPath);
			return JSON.parse(cachedLyricData);
		}
	} catch (err) {
		warn("警告：加载已缓存歌词失败", err);
	}
	const nid = parseInt(String(id));
	if (typeof id === "number" || !Number.isNaN(nid)) {
		const data = await getLyric(parseInt(String(id)));
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

export const loadTTMLLyric = async (
	id: string | number,
): Promise<LyricLine[] | null> => {
	const lyricsPath = normalizePath(
		`${plugin.pluginPath}/../../amll-data/ttml-lyrics`,
	);
	const ttmlLyricPath = `${lyricsPath}/${id}.ttml`;
	if (await betterncm.fs.exists(ttmlLyricPath)) {
		const cachedLyricData = await betterncm.fs.readFileText(ttmlLyricPath);
		if (cachedLyricData.includes("\n")) {
			return parseTTMLLyric(cachedLyricData);
		} else {
			return parseTTMLLyric(cachedLyricData, true);
		}
	}
	return null;
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

export async function genBitmapImageFromURL(
	imageUrl: string,
	width?: number,
	height?: number,
) {
	const img = new Image();
	img.src = imageUrl;
	return await genBitmapImage(img, width, height);
}

export async function genBitmapImage(
	img: HTMLImageElement,
	width?: number,
	height?: number,
) {
	await img.decode();
	return createImageBitmap(img, 0, 0, img.width, img.height, {
		resizeWidth: width ?? img.width,
		resizeHeight: height ?? img.height,
		resizeQuality: "pixelated",
	});
}

export function setClipboardData(data: string) {
	legacyNativeCmder._envAdapter.callAdapter(
		"winhelper.setClipBoardData",
		() => {},
		[data],
	);
}

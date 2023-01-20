/// <reference types="./betterncm" />

interface EAPIResponse {
	code: number;
	error?: string;
}

interface EAPILyric {
	version: number;
	lyric: string;
}

interface EAPILyricResponse extends EAPIResponse {
	lrc?: EAPILyric;
	tlyric?: EAPILyric;
	romalrc?: EAPILyric;
	yrc?: EAPILyric;
}

declare namespace channel {
	export function call(command: string, callback: Function, args: any[]);
	export function encryptId(data: string): string;
}
type NCMInjectPlugin = import("plugin").NCMInjectPlugin;
interface LFPNCMPlugin extends NCMInjectPlugin {
	currentAudioPlayer: HTMLAudioElement;
	volume: HTMLAudioElement["volume"];
	currentAudioId: [string, string];
	playedTime: number;
	enabled: boolean;
	info: {
		playState: number;
		lastPlayStartTime: number;
		playedTime: number;
		duration: number;
		playProgress: number;
		loadProgress: number;
		currentAudioId: string;
		url: string;
		lastError: number | undefined;
	};
}

declare var APP_CONF: any;
declare var pluginPath: string;
declare var plugin: import("plugin").NCMInjectPlugin;
declare var loadedPlugins: {
	LibFrontendPlay: LFPNCMPlugin | undefined;
	[pluginId: string]: import("plugin").NCMInjectPlugin | undefined;
};
declare const betterncm: typeof import("betterncm-api/index").default;
declare const legacyNativeCmder: any;
declare const DEBUG: boolean;
declare const OPEN_PAGE_DIRECTLY: boolean;
declare const isOSX: boolean;
interface Document {
	webkitIsFullScreen: boolean;
}

interface HTMLElement {
	webkitRequestFullScreen: Function;
}

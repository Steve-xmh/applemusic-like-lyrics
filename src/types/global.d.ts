/// <reference types="./betterncm" />

declare module "*.wgsl" {
	const value: string;
	export default value;
}

declare module "*.glsl" {
	const value: string;
	export default value;
}

declare module "*.frag" {
	const value: string;
	export default value;
}

declare module "*.vert" {
	const value: string;
	export default value;
}

declare module "*.svg" {
	const value: React.FC<React.SVGProps<SVGSVGElement>>;
	export default value;
}

interface EAPIResponse {
	code: number;
	error?: string;
}

interface EAPILyric {
	version: number;
	lyric: string;
}

// rome-ignore lint/correctness/noUnusedVariables: <explanation>
interface EAPILyricResponse extends EAPIResponse {
	lrc?: EAPILyric;
	tlyric?: EAPILyric;
	romalrc?: EAPILyric;
	yromalrc?: EAPILyric;
	ytlrc?: EAPILyric;
}

declare namespace channel {
	// rome-ignore lint/suspicious/noExplicitAny: <explanation>
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

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
declare var APP_CONF: any;
declare var pluginPath: string;
declare var plugin: import("plugin").NCMInjectPlugin;
declare var loadedPlugins: {
	LibFrontendPlay: LFPNCMPlugin | undefined;
	[pluginId: string]: import("plugin").NCMInjectPlugin | undefined;
};
declare const betterncm: typeof import("betterncm-api/index").default;
// rome-ignore lint/suspicious/noExplicitAny: <explanation>
declare const legacyNativeCmder: any;
declare const DEBUG: boolean;
declare const OPEN_PAGE_DIRECTLY: boolean;
declare const isOSX: boolean;
// rome-ignore lint/correctness/noUnusedVariables: <explanation>
interface Document {
	webkitIsFullScreen: boolean;
}

// rome-ignore lint/correctness/noUnusedVariables: <explanation>
interface HTMLElement {
	webkitRequestFullScreen: Function;
}

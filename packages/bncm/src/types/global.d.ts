/// <reference types="./betterncm" />
/// <reference types="vite-plugin-svgr/client" />

declare module "*.css" {
	const cssStyle: string;
	export default cssStyle;
}

declare module "*.wgsl" {
	const wgslShader: string;
	export default wgslShader;
}

declare module "*.glsl" {
	const glslShader: string;
	export default glslShader;
}

declare module "*.frag" {
	const fragShader: string;
	export default fragShader;
}

declare module "*.vert" {
	const vertShader: string;
	export default vertShader;
}

interface EAPIResponse {
	code: number;
	error?: string;
}

interface EAPILyric {
	version: number;
	lyric: string;
}

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
interface EAPILyricResponse extends EAPIResponse {
	lrc?: EAPILyric;
	tlyric?: EAPILyric;
	romalrc?: EAPILyric;
	yromalrc?: EAPILyric;
	ytlrc?: EAPILyric;
}

declare namespace channel {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	export function call(command: string, callback: Function, args: any[]);
	export function registerCall(name: string, callback: Function);
	export function encryptId(data: string): string;
	// export let registerCallbacks: Map<string, Set<Function>>;
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

interface AMLLInjectPlugin extends NCMInjectPlugin {
	musicStatus: import("/Users/stevexmh/Documents/programs/applemusic-like-lyrics/packages/bncm/src/music-context/v2").MusicStatusGetterV2;
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
declare let APP_CONF: any;
declare let pluginPath: string;
declare let plugin: AMLLInjectPlugin;
declare let loadedPlugins: {
	LibFrontendPlay: LFPNCMPlugin | undefined;
	[pluginId: string]: import("plugin").NCMInjectPlugin | undefined;
};
declare const betterncm: typeof import("betterncm-api/index").default;
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
declare const legacyNativeCmder: any;
declare const DEBUG: boolean;
declare const OPEN_PAGE_DIRECTLY: boolean;
declare const isOSX: boolean;
// biome-ignore lint/correctness/noUnusedVariables: <explanation>
interface Document {
	webkitIsFullScreen: boolean;
}

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
interface HTMLElement {
	webkitRequestFullScreen: Function;
}

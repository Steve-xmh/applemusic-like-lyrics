/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vite-plugin-i18next-loader/vite" />

declare module "md5" {
	export default function md5(input: string): string;
}

declare module "virtual:git-metadata-plugin" {
	export const commit: string;
	export const branch: string;
}

declare module "virtual:i18next-loader" {
	const resources: typeof import("../locales/zh-CN/translation.json");
	export default resources;
}

declare enum SystemTitlebarAppearance {
	Windows = "windows",
	MacOS = "macos",
	Hidden = "hidden",
}

declare function setSystemTitlebarAppearance(
	appearance: SystemTitlebarAppearance,
): void;
declare enum SystemTitlebarResizeAppearance {
	Restore = "restore",
	Maximize = "maximize",
}
declare function setSystemTitlebarResizeAppearance(
	appearance: SystemTitlebarResizeAppearance,
): void;
declare function setSystemTitlebarFullscreen(enable: boolean): void;
declare function setSystemTitlebarImmersiveMode(enable: boolean): void;
declare function addEventListener(
	type: "on-system-titlebar-click-close",
	listener: (evt: Event) => void,
): void;
declare function addEventListener(
	type: "on-system-titlebar-click-resize",
	listener: (evt: Event) => void,
): void;
declare function addEventListener(
	type: "on-system-titlebar-click-minimize",
	listener: (evt: Event) => void,
): void;

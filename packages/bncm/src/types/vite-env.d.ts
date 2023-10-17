/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module "virtual:bncm-plugin-manifest" {
	const manifest: typeof import("../../manifest.json");
	export default manifest;
}

declare type BNCMManifest =
	typeof import("virtual:bncm-plugin-manifest").default;

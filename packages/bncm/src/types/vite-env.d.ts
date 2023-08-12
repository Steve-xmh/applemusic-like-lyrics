/// <reference types="vite/client" />

declare module "*.svg" {
	declare const svgComponent: import("react").FC<
		import("react").HTMLProps<SVGElement>
	>;
	export default svgComponent;
}

declare module "virtual:bncm-plugin-manifest" {
	const manifest: typeof import("../../manifest.json");
	export default manifest;
}

declare type BNCMManifest = typeof import("virtual:bncm-plugin-manifest").default;

/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

declare module "md5" {
	export default function md5(input: string): string;
}

declare module "virtual:git-metadata-plugin" {
	export const commit: string;
	export const branch: string;
}

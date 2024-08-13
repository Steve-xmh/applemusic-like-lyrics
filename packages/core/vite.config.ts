import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import wasm from "vite-plugin-wasm";
import path from "path";

export default defineConfig({
	build: {
		sourcemap: true,
		lib: {
			entry: "src/index.ts",
			name: "AppleMusicLikeLyricsCore",
			fileName: "amll-core",
			formats: ["es"],
		},
		cssMinify: "lightningcss",
		rollupOptions: {
			external: [
				"@pixi/display",
				"@pixi/app",
				"@pixi/filter-blur",
				"@pixi/filter-color-matrix",
				"@pixi/filter-bulge-pinch",
				"@pixi/core",
				"@pixi/sprite",
			],
		},
	},
	resolve: {
		alias: {
			"@applemusic-like-lyrics/lyric": path.resolve(
				__dirname,
				"../lyric/pkg",
			),
			"@applemusic-like-lyrics/ttml": path.resolve(
				__dirname,
				"../ttml/src",
			),
		},
	},
	plugins: [
		wasm(),
		dts({
			exclude: ["src/test.ts"],
		}),
	],
});

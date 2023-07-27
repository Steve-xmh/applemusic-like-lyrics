import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

export default defineConfig({
	build: {
		sourcemap: true,
		lib: {
			entry: "src/index.ts",
			name: "AppleMusicLikeLyricsCore",
			fileName: "amll-core",
			formats: ["es", "cjs"],
		},
		rollupOptions: {
			external: [
				"@pixi/display",
				"@pixi/app",
				"@pixi/filter-blur",
				"@pixi/filter-color-matrix",
				"@pixi/core",
				"@pixi/sprite",
				"jss",
				"jss-preset-default",
			],
		},
	},
	plugins: [
		wasm(),
		topLevelAwait(),
		dts({
			exclude: ["src/test.ts"],
		}),
	],
});

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	build: {
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
		dts({
			exclude: ["src/test.ts"],
		}),
	],
});

import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	build: {
		lib: {
			entry: "src/index.ts",
			name: "AppleMusicLikeLyricsCore",
			fileName: "amll-core",
		},
		rollupOptions: {
			external: ["pixi.js", "jss", "jss-preset-default"],
		},
	},
	plugins: [dts({
		exclude: [
			"src/test.ts",
		]
	})],
});

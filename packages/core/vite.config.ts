import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: "src/index.ts",
			name: "AppleMusicLikeLyricsCore",
			fileName: "amll-core",
		},
		rollupOptions: {
			external: ["pixi.js"],
			output: {
				globals: {
					"pixi.js": "PIXI",
				},
			},
		},
	},
});

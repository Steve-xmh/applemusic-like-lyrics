import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
	build: {
		sourcemap: true,
		lib: {
			entry: "src/index.ts",
			name: "AppleMusicLikeLyricsVue",
			fileName: "amll-vue",
			formats: ["es", "cjs"],
		},
		rollupOptions: {
			external: ["vue", "@applemusic-like-lyrics/core"],
		},
	},
	plugins: [
		vue(),
		dts({
			exclude: ["src/test.ts", "src/test-app.vue"],
		}),
	],
});

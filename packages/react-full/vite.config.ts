import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import svgr from "vite-plugin-svgr";
import wasm from "vite-plugin-wasm";

export default defineConfig({
	build: {
		sourcemap: true,
		lib: {
			entry: "src/index.ts",
			name: "AppleMusicLikeLyricsReactFramework",
			fileName: "amll-react-framework",
			formats: ["es", "cjs"],
		},
		rollupOptions: {
			external: ["react", "react-dom", "react/jsx-runtime", "@applemusic-like-lyrics/core", "jotai"],
		},
		cssMinify: 'lightningcss',
	},
	css: {
		transformer: 'lightningcss'
	},
	plugins: [
		wasm(),
		react(),
		dts({
			exclude: ["src/test.tsx", "src/test-app.tsx"],
		}),
		svgr({
			svgrOptions: {
				ref: true,
			},
			include: ["./src/**/*.svg?react"],
		}),
	],
});

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

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
			external: ["react", "react-dom", "react/jsx-runtime", "@applemusic-like-lyrics/core"],
		},
	},
	plugins: [
		react(),
		dts({
			exclude: ["src/test.tsx", "src/test-app.tsx"],
		}),
	],
});

import react from "@vitejs/plugin-react";
import { execSync } from "child_process";
import { resolve } from "path";
import { type Plugin, defineConfig } from "vite";
import i18nextLoader from "vite-plugin-i18next-loader";
import lightningcss from "vite-plugin-lightningcss";
import svgr from "vite-plugin-svgr";
import topLevelAwait from "vite-plugin-top-level-await";
import wasm from "vite-plugin-wasm";

function getCommitHash() {
	try {
		return execSync("git rev-parse HEAD", { stdio: "pipe" })
			.toString("utf8")
			.trim();
	} catch (err) {
		console.warn("警告：获取 Git Commit Hash 失败", err);
		return "";
	}
}

function getBranchName() {
	try {
		return execSync("git branch --show-current", { stdio: "pipe" })
			.toString("utf8")
			.trim();
	} catch (err) {
		console.warn("警告：获取 Git Branch Name 失败", err);
		return "";
	}
}

const GitMetadataPlugin = (): Plugin => {
	const VIRTUAL_ID = "virtual:git-metadata-plugin";
	const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;
	let gitCommit = "";
	let gitBranch = "";
	return {
		name: "git-metadata-plugin",
		async buildStart() {
			const metadata = {
				commit: "",
				branch: "",
			};
			try {
				gitCommit = getCommitHash();
			} catch (err) {
				console.warn("警告：获取 Git Commit Hash 失败", err);
			}
			try {
				gitBranch = getBranchName();
			} catch (err) {
				console.warn("警告：获取 Git Branch Name 失败", err);
			}
			this.emitFile({
				fileName: "git-metadata.json",
				name: "git-metadata",
				needsCodeReference: false,
				source: JSON.stringify(metadata),
				type: "asset",
			});
		},
		resolveId(id) {
			if (id === VIRTUAL_ID) {
				return RESOLVED_VIRTUAL_ID;
			}
		},
		load(id) {
			if (id === RESOLVED_VIRTUAL_ID) {
				return `export const commit = ${JSON.stringify(gitCommit)};\nexport const branch = ${JSON.stringify(gitBranch)};`;
			}
		},
	};
};

// https://vitejs.dev/config/
export default defineConfig(async () => ({
	build: {
		sourcemap: true,
	},
	plugins: [
		react(),
		wasm(),
		topLevelAwait(),
		svgr({
			svgrOptions: {
				ref: true,
			},
			include: ["./src/**/*.svg?react", "../react-full/src/**/*.svg?react"],
		}),
		lightningcss({
			browserslist: "safari >= 10.13, chrome >= 91",
		}),
		GitMetadataPlugin(),
		i18nextLoader({
			paths: ["./locales"],
			namespaceResolution: "basename",
		}),
	],
	resolve: {
		dedupe: ["react", "react-dom", "jotai"],
		alias: {
			"@applemusic-like-lyrics/core": resolve(__dirname, "../core/src"),
			"@applemusic-like-lyrics/react": resolve(__dirname, "../react/src"),
			"@applemusic-like-lyrics/ttml": resolve(__dirname, "../ttml/src"),
			"@applemusic-like-lyrics/react-full": resolve(
				__dirname,
				"../react-full/src",
			),
		},
	},
	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent vite from obscuring rust errors
	clearScreen: false,
	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 1420,
		strictPort: true,
	},
	// 3. to make use of `TAURI_DEBUG` and other env variables
	// https://tauri.studio/v1/api/config#buildconfig.beforedevcommand
	envPrefix: ["VITE_", "TAURI_"],
}));

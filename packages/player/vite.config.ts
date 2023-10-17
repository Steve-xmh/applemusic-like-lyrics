import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import svgr from "vite-plugin-svgr";
import lightningcss from "vite-plugin-lightningcss";
import { execSync } from "child_process";
import { readFile } from "fs/promises";

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

const BNCMManifestPlugin = ({ manifestPath = "manifest.json" }): Plugin => {
	const VIRTUAL_ID = "virtual:bncm-plugin-manifest";
	const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;
	let manifestJson = "{}";
	return {
		name: "bncm-manifest-plugin",
		async buildStart() {
			this.addWatchFile(manifestPath);
			const rawManifest: BNCMManifest = JSON.parse(
				await readFile(manifestPath, { encoding: "utf8" }),
			);
			rawManifest.commit = getCommitHash();
			rawManifest.branch = getBranchName();
			manifestJson = JSON.stringify(rawManifest);
			this.emitFile({
				fileName: "manifest.json",
				name: "manifest",
				needsCodeReference: false,
				source: manifestJson,
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
				return `export default ${manifestJson};`;
			}
		},
	};
};

// https://vitejs.dev/config/
export default defineConfig(async () => ({
	plugins: [
		react(),
		wasm(),
		topLevelAwait(),
		svgr({
			svgrOptions: {
				ref: true,
			},
			include: ["./src/**/*.svg?react", "../bncm/src/**/*.svg?react"],
		}),
		lightningcss({
			browserslist: "safari >= 10.13, chrome >= 91",
		}),
		BNCMManifestPlugin({}),
	],
	resolve: {
		alias: {
			// "@applemusic-like-lyrics/bncm": "@applemusic-like-lyrics/bncm/src",
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

import react from "@vitejs/plugin-react";
import { Plugin, defineConfig, loadEnv } from "vite";
import { resolve } from "path";
import os from "os";
import { cpSync, rmSync } from "fs";
import { readFile } from "fs/promises";

function getDefaultBetterNCMPath() {
	if (os.type() === "Windows_NT") {
		return "C:/betterncm";
	} else if (os.type() === "Darwin") {
		return resolve(os.userInfo().homedir, ".betterncm");
	}
	return "./betterncm";
}

const CopyBetterNCMPlugin = ({
	distDir = "dist",
	manifestPath = "public/manifest.json",
	name = "ncm-plugin",
}): Plugin => {
	const fullDistDir = resolve(__dirname, distDir);
	return {
		name: "copy-betterncm",
		buildStart() {
			this.addWatchFile(manifestPath);
		},
		closeBundle() {
			const bncmPath =
				process.env["BETTERNCM_PROFILE"] || getDefaultBetterNCMPath();
			const devPath = resolve(bncmPath, "plugins_dev", name);
			this.info(`copying ${fullDistDir} to ${devPath}`);
			rmSync(devPath, {
				recursive: true,
			});
			cpSync(fullDistDir, devPath, {
				recursive: true,
			});
		},
	};
};

const WASMPlugin = (): Plugin => {
	const fileRegex = /\.(wasm)$/;
	return {
		name: "wasm-plugin",
		async load(id, _option) {
			if (fileRegex.test(id)) {
				return {
					code: `
					const WASM_BASE64_DATA = "${await readFile(id, "base64")}";
					const WASM_INSTANCE = await WebAssembly.instantiateStreaming(await fetch("data:application/wasm;base64,"+WASM_BASE64_DATA));
					export default WASM_INSTANCE;
					`,
				};
			}
		},
	};
};

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "AMLL");
	return {
		mode: env.AMLL_DEV ? "development" : "production",
		envPrefix: ["AMLL_"],
		build: {
			target: ["chrome91", "safari15"],
			cssMinify: env.AMLL_DEV ? false : "lightningcss",
			emptyOutDir: true,
			lib: {
				entry: "./src/index.ts",
				name: "amllncm",
				fileName: "amll-bncm",
				formats: ["es"],
			},
			minify: env.AMLL_DEV ? false : "esbuild",
			sourcemap: env.AMLL_DEV ? "inline" : true,
		},
		plugins: [
			react(),
			WASMPlugin(),
			env.AMLL_DEV &&
				CopyBetterNCMPlugin({
					name: "Apple-Musiclike-lyrics",
				}),
		],
		define: {
			"process.env": "({})",
		},
	};
});

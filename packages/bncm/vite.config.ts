import react from "@vitejs/plugin-react";
import { Plugin, defineConfig, loadEnv } from "vite";
import { resolve } from "path";
import * as os from "os";
import {
	cp,
	mkdir,
	readdir,
	rename,
	rm,
	stat,
	writeFile,
	readFile,
} from "fs/promises";
import wasm from "vite-plugin-wasm";
import svgr from "vite-plugin-svgr";
import { minify as terserMinify } from "terser";
import { execSync } from "child_process";

function getDefaultBetterNCMPath() {
	if (os.type() === "Windows_NT") {
		return "C:/betterncm";
	} else if (os.type() === "Darwin") {
		return resolve(os.userInfo().homedir, ".betterncm");
	}
	return "./betterncm";
}

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

const CopyBetterNCMPlugin = ({
	distDir = "dist",
	manifestPath = "manifest.json",
	name = "ncm-plugin",
	minify = false,
	packPlugin = false,
}): Plugin => {
	const fullDistDir = resolve(__dirname, distDir);
	return {
		name: "copy-betterncm",
		buildStart() {
			this.addWatchFile(manifestPath);
		},
		async closeBundle() {
			const bncmPath =
				process.env["BETTERNCM_PROFILE"] || getDefaultBetterNCMPath();
			const devPath = resolve(bncmPath, "plugins_dev", name);
			this.info(`copying ${fullDistDir} to ${devPath}`);
			async function copyDir(srcDir: string, destDir: string) {
				const tasks: Promise<unknown>[] = [];
				await mkdir(destDir, { recursive: true });
				for (const file of await readdir(srcDir)) {
					const srcFile = resolve(srcDir, file);
					const newName = file.replace(/\.mjs$/, ".js");
					const destFile = resolve(destDir, newName);
					if ((await stat(srcFile)).isDirectory()) {
						tasks.push(copyDir(srcFile, destFile));
					} else if (destFile.endsWith(".js") && minify) {
						tasks.push(
							(async () => {
								console.log(`Compressing ${srcFile}`);
								const srcCode = await readFile(srcFile, { encoding: "utf8" });
								const result = await terserMinify(srcCode, {
									module: true,
									compress: {
										global_defs: {
											"process.env.NODE_ENV": "production",
										},
										passes: 3,
									},
								});
								if (!result.code) return;
								await writeFile(destFile, result.code);
								await writeFile(resolve(srcDir, newName), result.code);
								await rm(srcFile);
								console.log(
									`Compressed ${srcFile} to ${destFile} (${srcCode.length} -> ${result.code.length})`,
								);
							})(),
						);
					} else if (destFile.endsWith(".js")) {
						tasks.push(rename(srcFile, resolve(srcDir, newName)));
					} else {
						tasks.push(cp(srcFile, destFile));
					}
				}
				await Promise.all(tasks);
			}
			try {
				await rm(devPath, {
					recursive: true,
				});
			} catch {}
			try {
				await copyDir(fullDistDir, devPath);
			} catch (err) {
				this.warn(`Copy failed ${err}`);
			}
		},
	};
};

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "AMLL");
	console.log(env);
	return {
		mode: env.AMLL_DEV === "true" ? "development" : "production",
		envPrefix: ["AMLL_"],
		server: {
			proxy: {
				"/ncmapi": {
					target: "https://music.163.com",
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/ncmapi/, ""),
					headers: {
						Cookie: process.env.NCM_COOKIE ?? "",
					},
				},
			},
		},
		build: {
			target: ["chrome91", "safari15"],
			cssMinify: env.AMLL_DEV === "true" ? false : "lightningcss",
			emptyOutDir: true,
			lib: {
				entry: "./src/index.ts",
				name: "amllncm",
				fileName: "amll-bncm",
				formats: ["es"],
			},
			minify: env.AMLL_MINIFY === "true" ? false : "esbuild",
		},
		plugins: [
			react(),
			wasm(),
			svgr({
				exportAsDefault: true,
				include: ["./src/**/*.svg"],
			}),
			CopyBetterNCMPlugin({
				name: "Apple-Musiclike-lyrics",
				minify: env.AMLL_MINIFY === "true",
				packPlugin: env.AMLL_PACK_PLUGIN === "true",
			}),
			BNCMManifestPlugin({}),
		],
		define:
			env.AMLL_DEV === "true"
				? {
						"process.env.NODE_ENV": '"development"',
				  }
				: undefined,
	};
});

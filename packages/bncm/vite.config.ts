import react from "@vitejs/plugin-react";
import { Plugin, defineConfig, loadEnv } from "vite";
import { resolve } from "path";
import os from "os";
import { cpSync, mkdirSync, readdirSync, rmSync, statSync } from "fs";
import wasm from "vite-plugin-wasm";
import reactSvg from "vite-plugin-react-svg";
import terser from "@rollup/plugin-terser";
import { buildSync } from "esbuild";

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
	dev = false,
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
			function copyDir(srcDir: string, destDir: string) {
				mkdirSync(destDir, { recursive: true });
				for (const file of readdirSync(srcDir)) {
					const srcFile = resolve(srcDir, file);
					const destFile = resolve(destDir, file.replace(
						/\.mjs$/,
						".js",
					));
					if (statSync(srcFile).isDirectory()) {
						copyDir(srcFile, destFile);
					} else if (destFile.endsWith(".js") && !dev) {
						buildSync({
							entryPoints: [srcFile],
							outfile: destFile,
							minify: true,
							define: {
								"process.env.NODE_ENV": '"production"',
							}
						});
					} else {
						cpSync(srcFile, destFile);
					}
				}
			}
			try {
				rmSync(devPath, {
					recursive: true,
				});
			} catch {}
			copyDir(fullDistDir, devPath);
		},
	};
};

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "AMLL");
	return {
		mode: env.AMLL_DEV ? "development" : "production",
		envPrefix: ["AMLL_"],
		server: {
			proxy: {
				'/ncmapi': {
					target: "https://music.163.com",
					changeOrigin: true,
					rewrite: (path) => path.replace(/^\/ncmapi/, ''),
					headers: {
						Cookie: process.env.NCM_COOKIE ?? "",
					}
				}
			}
		},
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
			minify: env?.AMLL_DEV ? false : "esbuild",
			sourcemap: env?.AMLL_DEV ? "inline" : true,
			rollupOptions: {
				plugins: [!env.AMLL_DEV && terser()],
			},
		},
		plugins: [
			react(),
			wasm(),
			reactSvg({
				defaultExport: "component",
				expandProps: "end",
				svgo: true,
				ref: true,
			}),
			CopyBetterNCMPlugin({
				name: "Apple-Musiclike-lyrics",
				dev: !!env.AMLL_DEV,
			}),
		],
		define: env.AMLL_DEV ? {
			"process.env.NODE_ENV": '"development"',
		} : undefined
	};
});

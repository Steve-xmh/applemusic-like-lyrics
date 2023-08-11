import react from "@vitejs/plugin-react";
import { Plugin, defineConfig, loadEnv } from "vite";
import { resolve } from "path";
import * as os from "os";
import { cp, mkdir, readdir, rm, stat, writeFile, readFile } from "fs/promises";
import wasm from "vite-plugin-wasm";
import svgr from "vite-plugin-svgr";
import terser from "@rollup/plugin-terser";
import { minify } from "terser";

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
		async closeBundle() {
			const bncmPath =
				process.env["BETTERNCM_PROFILE"] || getDefaultBetterNCMPath();
			const devPath = resolve(bncmPath, "plugins_dev", name);
			this.info(`copying ${fullDistDir} to ${devPath}`);
			async function copyDir(srcDir: string, destDir: string) {
				const tasks = [];
				await mkdir(destDir, { recursive: true });
				for (const file of await readdir(srcDir)) {
					const srcFile = resolve(srcDir, file);
					const destFile = resolve(destDir, file.replace(
						/\.mjs$/,
						".js",
					));
					if ((await stat(srcFile)).isDirectory()) {
						tasks.push(copyDir(srcFile, destFile));
					} else if (destFile.endsWith(".js") && !dev) {
						// buildSync({
						// 	entryPoints: [srcFile],
						// 	outfile: destFile,
						// 	minify: true,
						// 	define: {
						// 		"process.env.NODE_ENV": '"production"',
						// 	}
						// });
						tasks.push((async () => {
							console.log("Compressing " + srcFile);
							const srcCode = await readFile(srcFile, { encoding: "utf8" })
							const result = await minify(srcCode, {
								module: true,
								compress: {
									global_defs: {
										"process.env.NODE_ENV": "production",
									},
									passes: 3
								}
							});
							await writeFile(destFile, result.code);
							console.log(`Compressed ${srcFile} to ${destFile} (${srcCode.length} -> ${result.code.length})`);
						})())
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
			await copyDir(fullDistDir, devPath);
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
			// rollupOptions: {
			// 	plugins: [!env.AMLL_DEV && terser()],
			// },
		},
		plugins: [
			react(),
			wasm(),
            svgr({
                exportAsDefault: true,
                include: ["./src/**/*.svg"]
            }),
			// reactSvg({
			// 	defaultExport: "component",
			// 	expandProps: "end",
			// 	ref: true,
			// }),
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

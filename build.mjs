import { build, serve } from "esbuild";
import { sassPlugin } from "esbuild-sass-plugin";
import { glsl } from "esbuild-plugin-glsl";
import JSZip from "jszip";
import fs from "fs";
import path from "path";
import os from "os";
import manifest from "./manifest.json" assert { type: "json" };

let entryPoints = [
	"src/index.tsx",
	"src/worker_script.ts",
	"src/startup_script.ts",
	"src/index.sass",
];

const IS_DEV = process.argv.includes("--dev");

const plugins = [
	sassPlugin(),
	glsl({
		minify: !IS_DEV,
	}),
];

function getDefaultBetterNCMPath() {
	if (os.type() === "Windows_NT") {
		return "C:/betterncm";
	} else if (os.type() === "Darwin") {
		return path.resolve(os.userInfo().homedir, ".betterncm");
	}
	return "./betterncm";
}

const betterncmUserPath =
	process.env["BETTERNCM_PROFILE"] || getDefaultBetterNCMPath();
let devPath = path.resolve(
	betterncmUserPath,
	"plugins_dev",
	manifest.slug || manifest.name,
);

if (process.argv.includes("--style-only")) {
	entryPoints = ["src/index.sass"];
}

if (process.argv.includes("--lyric-test")) {
	entryPoints = ["src/lyric-test.tsx", "src/index.sass"];
}

/** @type {import("esbuild").BuildOptions} */
const buildOption = {
	entryPoints,
	bundle: true,
	sourcemap: IS_DEV ? "inline" : false,
	legalComments: "external",
	minify: !IS_DEV || process.argv.includes("--dist"),
	outdir: process.argv.includes("--dist") ? "dist" : devPath,
	target: "safari11",
	logOverride: {
		"empty-import-meta": "silent",
	},
	charset: "utf8",
	define: {
		DEBUG: IS_DEV.toString(),
		OPEN_PAGE_DIRECTLY: process.argv
			.includes("--open-page-directly")
			.toString(),
	},
	watch: process.argv.includes("--watch")
		? {
				onRebuild(err, result) {
					console.log("Rebuilding");
					if (err) {
						console.warn(err.message);
					} else if (result) {
						console.log("Build success");
					}
				},
		  }
		: undefined,
	plugins,
};

console.log("Building plugin to", buildOption.outdir);

if (IS_DEV && process.argv.includes("--lyric-test")) {
	serve({}, buildOption).then((result) => {
		console.log(`Dev Server is listening on ${result.host}:${result.port}`);
	});
} else {
	build(buildOption)
		.then((result) => {
			if (result.errors.length > 0) {
				console.log("Build Failed");
				return;
			}
			console.log("Build success");

			if (!process.argv.includes("--dist")) {
				if (!fs.existsSync(devPath)) {
					fs.mkdirSync(devPath, {
						recursive: true,
					});
				}
				let shouldCopyManifest = true;
				if (fs.existsSync(path.resolve(devPath, "manifest.json"))) {
					const curData = fs.readFileSync("manifest.json", {
						encoding: "utf8",
					});
					const data = fs.readFileSync(path.resolve(devPath, "manifest.json"), {
						encoding: "utf8",
					});
					shouldCopyManifest = curData !== data;
				}
				if (shouldCopyManifest) {
					fs.copyFileSync(
						"manifest.json",
						path.resolve(devPath, "manifest.json"),
					);
				}
			}

			if (process.argv.includes("--dist")) {
				const plugin = new JSZip();
				function addIfExist(filename, name = filename) {
					if (fs.existsSync(filename))
						plugin.file(name, fs.readFileSync(filename));
				}
				if (process.argv.includes("--dist")) {
					addIfExist("dist/manifest.json", "manifest.json");
					addIfExist("dist/index.js", "index.js");
					addIfExist("dist/worker_script.js", "worker_script.js");
					addIfExist("dist/index.css", "index.css");
					addIfExist("dist/startup_script.js", "startup_script.js");
				} else {
					addIfExist("manifest.json");
					addIfExist("index.js");
					addIfExist("index.css");
					addIfExist("startup_script.js");
					addIfExist("worker_script.js");
				}
				const output = plugin.generateNodeStream({
					compression: "DEFLATE",
					compressionOptions: {
						level: 9,
					},
				});
				output.pipe(fs.createWriteStream("Apple Music-like lyrics.plugin"));
				fs.copyFileSync("manifest.json", "dist/manifest.json");
				fs.copyFileSync("assets/thumbnail.svg", "dist/thumbnail.svg");
			}
		})
		.catch((error) => {
			console.log("Build Failed");
		});
}

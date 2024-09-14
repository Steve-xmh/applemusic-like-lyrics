// 按照原版本号 + -dev. + 开发分支名 + . + git提交次数 生成开发版本号
// 最后写入到 ./src-tauri/tauri.conf.json 中
// git rev-list --count HEAD

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { exit } from "node:process";
import { fileURLToPath } from "node:url";

const tauriConfPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "../src-tauri/tauri.conf.json",
);

console.log("Reading tauri.conf.json from", tauriConfPath);

const tauriConf = JSON.parse(readFileSync(tauriConfPath, "utf-8"));

console.log("tauri.conf.json content:", tauriConf);

const baseVersion = tauriConf.version;

if (!/^[0-9]+\.[0-9]+\.[0-9]+$/.test(baseVersion)) {
    console.error(`Invalid base version: ${baseVersion}`);
    exit(1);
}

// const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
const commitCount = execSync("git rev-list --count HEAD").toString().trim();

const devVersion = `${baseVersion}+${commitCount}`;

tauriConf.version = devVersion;

console.log(`Generated dev version: ${baseVersion} -> ${devVersion}`);

writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, "\t"));

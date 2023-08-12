import * as React from "react";
import semverGt from "semver/functions/gt";
import { normalizePath } from "./path";
import { log, warn } from "./logger";
import JSZip from "jszip";
import { atom, useAtomValue } from "jotai";
import {
	enableUpdateBranchAtom,
	updateBranchAtom,
} from "../components/config/about";

interface RepoTreeEntry {
	id: string;
	name: string;
	type: "blob" | "tree";
	path: string;
	mode: string;
}

interface RepoBranch {
	commit: {
		id: string;
		short_id: string;
	};
	name: string;
	default: boolean;
}

export interface InstallableBranch {
	branch: string;
	path: string;
}

let cachedInstallableBranches: InstallableBranch[] | undefined;
export async function getInstallableBranches(force = false) {
	if (force) {
		cachedInstallableBranches = undefined;
	}

	if (cachedInstallableBranches !== undefined) {
		return cachedInstallableBranches;
	}

	const branches: RepoBranch[] = await fetch(
		"https://gitcode.net/api/v4/projects/228337/repository/branches",
		{ cache: "no-store" },
	).then((v) => v.json());

	const result: InstallableBranch[] = [];
	await Promise.all(
		branches.map(async (branch) => {
			console.log(branch);
			try {
				const res = await fetch(
					`https://gitcode.net/api/v4/projects/228337/repository/tree?path=packages%2Fbncm%2Fdist&ref=${encodeURIComponent(
						branch.name,
					)}`,
					{ cache: "no-store" },
				);
				let containsAllFiles = false;
				let entries: string[] = [];
				if (res.ok) {
					entries = ((await res.json()) as RepoTreeEntry[]).map((v) => v.name);
					if (entries.length > 0) {
						containsAllFiles = [
							"amll-bncm.js",
							"style.css",
							"manifest.json",
						].every((v) => entries.includes(v));
						if (containsAllFiles)
							result.push({
								branch: branch.name,
								path: "packages/bncm/dist",
							});
						return;
					}
				}
				const oldRes = await fetch(
					`https://gitcode.net/api/v4/projects/228337/repository/tree?path=dist&ref=${encodeURIComponent(
						branch.name,
					)}`,
					{ cache: "no-store" },
				);
				if (oldRes.ok) {
					entries = ((await oldRes.json()) as RepoTreeEntry[]).map((v) => v.name);
					containsAllFiles = ["index.js", "manifest.json"].every((v) =>
						entries.includes(v),
					);
					if (containsAllFiles)
						result.push({
							branch: branch.name,
							path: "dist",
						});
				}
			} catch (err) {
				warn("获取分支可更新状况失败", err);
			}
		}),
	);

	cachedInstallableBranches = result;
	window.dispatchEvent(new Event("amll-installable-branches-updated"));

	return result;
}

export async function installLatestBranchVersion(
	branchName: string,
	path = "packages/bncm/dist",
) {
	log("正在更新版本到", branchName, "分支的最新版本，位于远程路径", path);
	const entries: RepoTreeEntry[] = await fetch(
		`https://gitcode.net/api/v4/projects/228337/repository/tree?path=${encodeURIComponent(
			path,
		)}&ref=${encodeURIComponent(branchName)}`,
		{ cache: "no-store" },
	).then((v) => v.json());

	const files = await Promise.all(
		entries.map(async (entry) => {
			if (entry.type === "blob") {
				const downloadLink = `https://gitcode.net/sn/applemusic-like-lyrics/-/raw/${encodeURIComponent(
					branchName,
				)}/${entry.path}?inline=false`;
				log("正在下载更新文件", entry.path);
				const data = await fetch(downloadLink, { cache: "no-store" }).then(
					(v) => v.blob(),
				);
				return {
					name: entry.name,
					data,
				};
			}
		}),
	);

	const zip = new JSZip();

	await Promise.all(
		files.map(async (file) => {
			if (file) {
				const destPath = normalizePath(
					`${plugin.mainPlugin.pluginPath}/${file.name}`,
				);
				log("正在写入更新文件", destPath);
				zip.file(file.name, file.data);
				return betterncm.fs
					.writeFile(destPath, file.data)
					.then((v) =>
						v
							? Promise.resolve()
							: Promise.reject(`写入更新文件 ${file.name} 到 ${destPath} 失败`),
					);
			} else {
				return Promise.resolve();
			}
		}),
	);

	log("正在删除旧插件文件");
	const pluginsPath = normalizePath(
		`${plugin.mainPlugin.pluginPath}/../../plugins`,
	);

	for (const pluginPath of await betterncm.fs
		.readDir(pluginsPath)
		.then((v) => v.map(normalizePath))) {
		const pluginName = pluginPath.substring(pluginPath.lastIndexOf("/") + 1);
		if (
			pluginName.startsWith("Apple.Music-like.lyrics") ||
			pluginName.startsWith(plugin.mainPlugin.manifest.slug) ||
			pluginName.startsWith(plugin.mainPlugin.manifest.name)
		) {
			await betterncm.fs.remove(pluginPath);
		}
	}

	const outputPluginPath = normalizePath(
		`${pluginsPath}/${plugin.mainPlugin.manifest.slug}.plugin`,
	);
	log("正在打包插件文件", outputPluginPath);
	const data: Blob = await zip.generateAsync({
		type: "blob",
		compression: "STORE",
	});

	log("正在写入更新文件", outputPluginPath);
	await betterncm.fs.writeFile(outputPluginPath, data);
}

let cachedLatestVersion: string | undefined;
async function checkLatestVersion(
	branch: string,
	force = false,
	path = "",
): Promise<string> {
	if (force) cachedLatestVersion = undefined;

	if (cachedLatestVersion !== undefined) return cachedLatestVersion;

	let manifest: BNCMManifest | undefined;

	// 根据版本号 检查正式版本
	const GITHUB_DIST_MANIFEST_URLS = [
		`https://gitcode.net/sn/applemusic-like-lyrics/-/raw/${encodeURIComponent(
			branch,
		)}/${path
			.split("/")
			.map((v) => encodeURIComponent(v))
			.join("/")}/manifest.json?inline=false`,
		`https://gitcode.net/sn/applemusic-like-lyrics/-/raw/${encodeURIComponent(
			branch,
		)}/packages/bncm/dist/manifest.json?inline=false`,
		`https://gitcode.net/sn/applemusic-like-lyrics/-/raw/${encodeURIComponent(
			branch,
		)}/dist/manifest.json?inline=false`,
	];

	for (const url of GITHUB_DIST_MANIFEST_URLS) {
		try {
			const res = await fetch(url);
			if (res.ok) {
				manifest = await res.json();
				break;
			}
		} catch {}
	}

	if (manifest) {
		if (branch === "main") {
			if (cachedLatestVersion !== manifest.version) {
				window.dispatchEvent(new Event("amll-latest-version-updated"));
			}
			cachedLatestVersion = manifest.version;
		} else {
			if (cachedLatestVersion !== manifest.commit) {
				window.dispatchEvent(new Event("amll-latest-version-updated"));
			}
			cachedLatestVersion = manifest.commit;
		}
	}

	return cachedLatestVersion || "";
}

export const installableBranchesAtom = atom(() => getInstallableBranches());

export function useLatestVersion(): string {
	const [version, setVersion] = React.useState("");
	const branch = useAtomValue(updateBranchAtom);
	const enableUpdateBranch = useAtomValue(enableUpdateBranchAtom);

	React.useLayoutEffect(() => {
		const checkUpdate = () =>
			checkLatestVersion(enableUpdateBranch ? branch : "main").then(setVersion);
		checkUpdate();
		window.addEventListener("amll-latest-version-updated", checkUpdate);
		return () => {
			window.removeEventListener("amll-latest-version-updated", checkUpdate);
		};
	}, [branch, enableUpdateBranch]);

	React.useLayoutEffect(() => {
		setVersion("");
		checkLatestVersion(enableUpdateBranch ? branch : "main", true).then(
			setVersion,
		);
	}, [branch, enableUpdateBranch]);

	return version;
}

export function useHasUpdates(): boolean {
	const latestVersion = useLatestVersion();
	const branch = useAtomValue(updateBranchAtom);
	const enableUpdateBranch = useAtomValue(enableUpdateBranchAtom);
	return React.useMemo(() => {
		if (latestVersion !== "") {
			if (branch === "main" || !enableUpdateBranch) {
				try {
					return semverGt(latestVersion, plugin.mainPlugin.manifest.version);
				} catch {}
			}
			return latestVersion !== plugin.mainPlugin.manifest.commit;
		} else {
			return false;
		}
	}, [latestVersion, branch]);
}

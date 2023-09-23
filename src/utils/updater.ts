import * as React from "react";
import semverGt from "semver/functions/gt";
import { normalizePath } from "./path";
import { useConfigValue, useConfigValueBoolean } from "../api/react";
import { GLOBAL_EVENTS } from "./global-events";
import { log, warn } from "./logger";
import JSZip from "jszip";

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
		"https://gitcode.net/api/v4/projects/sn%2Fapplemusic-like-lyrics/repository/branches",
		{ cache: "no-store" },
	).then((v) => v.json());

	const result: InstallableBranch[] = [];
	await Promise.all(
		branches.map(async (branch) => {
			log(branch);
			try {
				const res = await fetch(
					`https://gitcode.net/api/v4/projects/sn%2Fapplemusic-like-lyrics/repository/tree?path=packages%2Fbncm%2Fdist&ref=${encodeURIComponent(
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
					`https://gitcode.net/api/v4/projects/sn%2Fapplemusic-like-lyrics/repository/tree?path=dist&ref=${encodeURIComponent(
						branch.name,
					)}`,
					{ cache: "no-store" },
				);
				if (oldRes.ok) {
					entries = ((await oldRes.json()) as RepoTreeEntry[]).map(
						(v) => v.name,
					);
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
	path: string,
) {
	log("正在更新版本到", branchName, "分支的最新版本，位于远程路径", path);
	const entries: RepoTreeEntry[] = await fetch(
		`https://gitcode.net/api/v4/projects/sn%2Fapplemusic-like-lyrics/repository/tree?path=${encodeURIComponent(
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
				const res = await fetch(downloadLink, {
					cache: "no-store",
				});
				if (!res.ok) {
					throw new Error(
						`更新文件 ${entry.path} 下载失败：${res.status} ${res.statusText}`,
					);
				}
				const data = await res.blob();
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

async function checkLatestVersion(
	branch: string,
	path: string,
): Promise<[string, string, string, string]> {
	log("正在检查更新", branch, path);

	let latestManifest;

	try {
		const res = await fetch(
			`https://gitcode.net/sn/applemusic-like-lyrics/-/raw/${encodeURIComponent(
				branch,
			)}/${path
				.split("/")
				.map((v) => encodeURIComponent(v))
				.join("/")}/manifest.json?inline=false`,
			{ cache: "no-store" },
		);
		if (res.ok) {
			latestManifest = await res.json();
		}
	} catch {}

	if (latestManifest) {
		return [
			latestManifest?.branch ?? branch,
			latestManifest.version,
			latestManifest?.commit?.slice(0, 8) ?? "",
			path,
		];
	} else {
		return [
			plugin.manifest?.branch ?? "main",
			plugin.manifest.version,
			plugin.manifest?.commit?.slice(0, 8) ?? "",
			"packages/bncm/dist",
		];
	}
}

export function useInstallableBranches(): InstallableBranch[] {
	const [branches, setBranches] = React.useState<InstallableBranch[]>([
		{
			branch: "main",
			path: "dist",
		},
	]);

	React.useLayoutEffect(() => {
		const checkUpdate = () => getInstallableBranches().then(setBranches);
		checkUpdate();
		GLOBAL_EVENTS.addEventListener("installable-branches-updated", checkUpdate);
		return () => {
			GLOBAL_EVENTS.removeEventListener(
				"installable-branches-updated",
				checkUpdate,
			);
		};
	}, []);

	return branches;
}

export function useLatestVersion(): [string, string, string, string] {
	const [version, setVersion] = React.useState<
		[string, string, string, string]
	>([
		plugin.manifest.branch,
		plugin.manifest.version,
		plugin.manifest?.commit?.slice(0, 8) ?? "",
		"dist",
	]);
	const branch = useConfigValue("updateBranch", "main");
	const enableUpdateBranch = useConfigValueBoolean("enableUpdateBranch", false);
	const installableBranch = useInstallableBranches();

	React.useLayoutEffect(() => {
		setVersion([
			plugin.manifest.branch,
			plugin.manifest.version,
			plugin.manifest?.commit?.slice(0, 8) ?? "",
			"dist",
		]);
		const targetBranch = installableBranch.find((b) => b.branch === branch);
		if (targetBranch) {
			const checkUpdate = () =>
				checkLatestVersion(targetBranch.branch, targetBranch.path).then(
					setVersion,
				);
			checkUpdate();
			GLOBAL_EVENTS.addEventListener("latest-version-updated", checkUpdate);
			return () => {
				GLOBAL_EVENTS.removeEventListener(
					"latest-version-updated",
					checkUpdate,
				);
			};
		}
	}, [branch, enableUpdateBranch, installableBranch]);

	return version;
}

export function useHasUpdates(): boolean {
	const branch = useConfigValue("updateBranch", "main");
	const [latestBranch, latestVersion, latestCommit] = useLatestVersion();
	return React.useMemo(() => {
		if (
			latestBranch === plugin.manifest.branch &&
			latestVersion === plugin.manifest.version &&
			latestCommit === plugin.manifest.commit.slice(0, 8)
		)
			return false;
		if (branch === plugin.manifest.branch) {
			if (plugin.manifest.branch === "main") {
				return semverGt(latestVersion, plugin.manifest.version);
			} else {
				return plugin.manifest.commit.slice(0, 8) !== latestCommit;
			}
		} else {
			return true;
		}
	}, [latestVersion, branch]);
}

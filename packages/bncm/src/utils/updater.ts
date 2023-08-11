import * as React from "react";
import semverGt from "semver/functions/gt";
import { normalizePath } from "./path";
import { log } from "./logger";
import JSZip from "jszip";
import { useAtomValue } from "jotai";
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

const UPDATE_FILES = ["index.js", "manifest.json"];

let cachedInstallableBranches: string[] | undefined;
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

	const result: string[] = [];
	await Promise.all(
		branches.map(async (branch) => {
			try {
				// https://gitcode.net/api/v4/projects/228337/repository/tree?path=dist&ref=
				const entries: RepoTreeEntry[] = await fetch(
					`https://gitcode.net/api/v4/projects/228337/repository/tree?path=dist&ref=${branch.name}`,
					{ cache: "no-store" },
				).then((v) => v.json());

				for (const file of UPDATE_FILES) {
					if (
						entries.findIndex((v) => v.name === file && v.type === "blob") ===
						-1
					) {
						return;
					}
				}

				result.push(branch.name);
			} catch {}
		}),
	);

	cachedInstallableBranches = result;
	window.dispatchEvent(new Event("amll-installable-branches-updated"));

	return result;
}

export async function installLatestBranchVersion(branchName: string) {
	log("正在更新版本到", branchName, "分支的最新版本");
	const entries: RepoTreeEntry[] = await fetch(
		`https://gitcode.net/api/v4/projects/228337/repository/tree?path=dist&ref=${branchName}`,
		{ cache: "no-store" },
	).then((v) => v.json());

	const files = await Promise.all(
		entries.map(async (entry) => {
			if (entry.type === "blob") {
				const downloadLink = `https://gitcode.net/sn/applemusic-like-lyrics/-/raw/${branchName}/${entry.path}?inline=false`;
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
): Promise<string> {
	if (force) {
		cachedLatestVersion = undefined;
	}

	if (cachedLatestVersion !== undefined) {
		return cachedLatestVersion;
	}

	if (branch === "main") {
		// 根据版本号 检查正式版本
		const GITHUB_DIST_MANIFEST_URL =
			"https://gitcode.net/sn/applemusic-like-lyrics/-/raw/main/packages/bncm/dist/manifest.json?inline=false";

		try {
			const manifest: typeof import("../../public/manifest.json") = await fetch(
				GITHUB_DIST_MANIFEST_URL,
			).then((v) => v.json());
			if (cachedLatestVersion !== manifest.version) {
				window.dispatchEvent(new Event("amll-latest-version-updated"));
			}
			cachedLatestVersion = manifest.version;
			return cachedLatestVersion;
		} catch {}
	} else {
		// 根据 Commit Hash 检查开发分支版本
		const GITHUB_DIST_MANIFEST_URL = `https://gitcode.net/sn/applemusic-like-lyrics/-/raw/${branch}/dist/manifest.json?inline=false`;

		try {
			const manifest: typeof import("../../public/manifest.json") = await fetch(
				GITHUB_DIST_MANIFEST_URL,
			).then((v) => v.json());
			if (cachedLatestVersion !== manifest.commit) {
				window.dispatchEvent(new Event("amll-latest-version-updated"));
			}
			cachedLatestVersion = manifest.commit;
			return cachedLatestVersion;
		} catch {}
	}

	return cachedLatestVersion || "";
}

export function useInstallableBranches(): string[] {
	const [branches, setBranches] = React.useState(["main"]);

	React.useLayoutEffect(() => {
		const checkUpdate = () => getInstallableBranches().then(setBranches);
		checkUpdate();
		window.addEventListener("amll-installable-branches-updated", checkUpdate);
		return () => {
			window.removeEventListener("installable-branches-updated", checkUpdate);
		};
	}, []);

	return branches;
}

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

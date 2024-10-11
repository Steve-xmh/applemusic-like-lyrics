import { appDataDir, join } from "@tauri-apps/api/path";
import { mkdir, readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { atom } from "jotai";
import type { PlayerPluginContext } from "../components/PluginContext";
import i18n from "../i18n";

export enum PluginLoadResult {
	Success = "success",
	Disabled = "disabled",
	InvaildPluginFile = "invaild-plugin-file",
	PluginIdConflict = "plugin-id-conflict",
	MissingMetadata = "missing-metadata",
	MissingDependency = "missing-dependency",
	JavaScriptFileCorrupted = "javascript-file-corrupted",
}

export interface PluginMetaState {
	loadResult: PluginLoadResult;
	id: string;
	fileName: string;
	scriptData: string;
	dependency: string[];
	[key: string]: string | string[] | undefined;
}

export interface LoadedPlugin {
	pluginMeta: PluginMetaState;
	pluginFunc: () => Promise<void>;
	context: PlayerPluginContext;
}

export const pluginDirAtom = atom(async () => {
	const appDir = await appDataDir();
	return await join(appDir, "plugins");
});

const reloadPluginMetaAtom = atom(Symbol());

export const loadedPluginsAtom = atom<LoadedPlugin[]>([]);

export const pluginMetaAtom = atom(
	async (get) => {
		get(reloadPluginMetaAtom);
		const pluginDir = await get(pluginDirAtom);
		await mkdir(pluginDir, { recursive: true });
		const plugins = await readDir(pluginDir);
		const META_REGEX = /^\/\/\s*@(\S+)\s*(.+)$/;
		const pluginMetas = await Promise.all(
			plugins
				.filter((v) => v.isFile)
				.map(async (pluginEntry) => {
					const pluginMeta: PluginMetaState = {
						loadResult: PluginLoadResult.Success,
						id: "",
						fileName: pluginEntry.name,
						scriptData: "",
						dependency: [],
					};
					if (
						pluginEntry.name.endsWith(".js.disabled") ||
						pluginEntry.name.endsWith(".js")
					) {
						if (pluginEntry.name.endsWith(".js.disabled"))
							pluginMeta.loadResult = PluginLoadResult.Disabled;
						const pluginData = await readTextFile(
							await join(pluginDir, pluginEntry.name),
						);
						for (const line of pluginData.split("\n")) {
							const trimmed = line.trim();
							if (trimmed.length > 0) {
								const matched = META_REGEX.exec(trimmed);
								if (matched) {
									if (matched[1] in pluginMeta) {
										if (Array.isArray(pluginMeta[matched[1]])) {
											(pluginMeta[matched[1]] as string[]).push(matched[2]);
										} else if (pluginMeta[matched[1]]) {
											pluginMeta[matched[1]] = [
												pluginMeta[matched[1]] as string,
												matched[2],
											];
										} else {
											pluginMeta[matched[1]] = matched[2];
										}
									} else {
										pluginMeta[matched[1]] = matched[2];
									}
								} else {
									break;
								}
							}
						}
						pluginMeta.fileName = pluginEntry.name;
						pluginMeta.scriptData = pluginData;

						for (const key of ["id", "version", "icon"]) {
							if (!(key in pluginMeta)) {
								pluginMeta.loadResult = PluginLoadResult.MissingMetadata;
								break;
							}
						}

						for (const localeKey of ["name", "description"]) {
							for (const key in pluginMeta) {
								if (key.startsWith(`${localeKey}:`)) {
									const [, lng] = key.split(":", 2);
									i18n.addResource(
										lng,
										pluginMeta.id,
										localeKey,
										String(pluginMeta[key]),
									);
								}
							}
						}
					} else {
						pluginMeta.loadResult = PluginLoadResult.InvaildPluginFile;
					}

					return Object.seal(pluginMeta);
				}),
		);
		const pluginIds = new Set<string>();
		const conflitsIds = new Set<string>();
		for (const pluginMeta of pluginMetas) {
			if (pluginIds.has(pluginMeta.id)) {
				conflitsIds.add(pluginMeta.id);
			} else {
				pluginIds.add(pluginMeta.id);
			}
		}
		for (const pluginMeta of pluginMetas) {
			for (const d of pluginMeta.dependency) {
				if (!pluginIds.has(d)) {
					pluginMeta.loadResult = PluginLoadResult.MissingDependency;
					break;
				}
			}
		}
		for (const pluginMeta of pluginMetas) {
			if (
				pluginMeta.loadResult === PluginLoadResult.Success &&
				conflitsIds.has(pluginMeta.id)
			) {
				pluginMeta.loadResult = PluginLoadResult.PluginIdConflict;
			}
		}
		pluginMetas.sort((a, b) => {
			if (a.loadResult === b.loadResult)
				return a.fileName.localeCompare(b.fileName);

			if (a.loadResult === PluginLoadResult.Success) return -1;
			if (b.loadResult === PluginLoadResult.Success) return 1;
			if (a.loadResult === PluginLoadResult.Disabled) return -1;
			if (b.loadResult === PluginLoadResult.Disabled) return 1;
		});
		return pluginMetas;
	},
	(_get, set) => {
		set(reloadPluginMetaAtom, Symbol());
	},
);

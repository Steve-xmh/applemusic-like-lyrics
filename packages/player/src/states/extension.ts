import { appDataDir, join } from "@tauri-apps/api/path";
import { mkdir, readDir, readTextFile } from "@tauri-apps/plugin-fs";
import { atom } from "jotai";
import type { PlayerExtensionContext } from "../components/ExtensionContext";
import i18n from "../i18n";

export enum ExtensionLoadResult {
	Loadable = "loadable",
	Disabled = "disabled",
	InvaildExtensionFile = "invaild-extension-file",
	ExtensionIdConflict = "extension-id-conflict",
	MissingMetadata = "missing-metadata",
	MissingDependency = "missing-dependency",
	JavaScriptFileCorrupted = "javascript-file-corrupted",
}

export interface ExtensionMetaState {
	loadResult: ExtensionLoadResult;
	id: string;
	fileName: string;
	scriptData: string;
	dependency: string[];
	[key: string]: string | string[] | undefined;
}

export interface LoadedExtension {
	extensionMeta: ExtensionMetaState;
	extensionFunc: () => Promise<void>;
	context: PlayerExtensionContext;
}

export const extensionDirAtom = atom(async () => {
	const appDir = await appDataDir();
	return await join(appDir, "extensions");
});

const reloadExtensionMetaAtom = atom(Symbol());

export const loadedExtensionAtom = atom<LoadedExtension[]>([]);

export const extensionMetaAtom = atom(
	async (get) => {
		get(reloadExtensionMetaAtom);
		const extensionDir = await get(extensionDirAtom);
		await mkdir(extensionDir, { recursive: true });
		const extensions = await readDir(extensionDir);
		const META_REGEX = /^\/\/\s*@(\S+)\s*(.+)$/;
		const extensionMetas = await Promise.all(
			extensions
				.filter((v) => v.isFile)
				.map(async (extensionEntry) => {
					const extensionMeta: ExtensionMetaState = {
						loadResult: ExtensionLoadResult.Loadable,
						id: "",
						fileName: extensionEntry.name,
						scriptData: "",
						dependency: [],
					};
					if (
						extensionEntry.name.endsWith(".js.disabled") ||
						extensionEntry.name.endsWith(".js")
					) {
						if (extensionEntry.name.endsWith(".js.disabled"))
							extensionMeta.loadResult = ExtensionLoadResult.Disabled;
						const extensionData = await readTextFile(
							await join(extensionDir, extensionEntry.name),
						);
						for (const line of extensionData.split("\n")) {
							const trimmed = line.trim();
							if (trimmed.length > 0) {
								const matched = META_REGEX.exec(trimmed);
								if (matched) {
									if (matched[1] in extensionMeta) {
										if (Array.isArray(extensionMeta[matched[1]])) {
											(extensionMeta[matched[1]] as string[]).push(matched[2]);
										} else if (extensionMeta[matched[1]]) {
											extensionMeta[matched[1]] = [
												extensionMeta[matched[1]] as string,
												matched[2],
											];
										} else {
											extensionMeta[matched[1]] = matched[2];
										}
									} else {
										extensionMeta[matched[1]] = matched[2];
									}
								} else {
									break;
								}
							}
						}
						extensionMeta.fileName = extensionEntry.name;
						extensionMeta.scriptData = extensionData;

						for (const key of ["id", "version", "icon"]) {
							if (!(key in extensionMeta)) {
								extensionMeta.loadResult = ExtensionLoadResult.MissingMetadata;
								break;
							}
						}

						for (const localeKey of ["name", "description"]) {
							for (const key in extensionMeta) {
								if (key.startsWith(`${localeKey}:`)) {
									const [, lng] = key.split(":", 2);
									i18n.addResource(
										lng,
										extensionMeta.id,
										localeKey,
										String(extensionMeta[key]),
									);
								}
							}
						}
					} else {
						extensionMeta.loadResult = ExtensionLoadResult.InvaildExtensionFile;
					}

					return Object.seal(extensionMeta);
				}),
		);
		const extensionIds = new Set<string>();
		const conflitsIds = new Set<string>();
		for (const extensionMeta of extensionMetas) {
			if (extensionIds.has(extensionMeta.id)) {
				conflitsIds.add(extensionMeta.id);
			} else {
				extensionIds.add(extensionMeta.id);
			}
		}
		for (const extensionMeta of extensionMetas) {
			for (const d of extensionMeta.dependency) {
				if (!extensionIds.has(d)) {
					extensionMeta.loadResult = ExtensionLoadResult.MissingDependency;
					break;
				}
			}
		}
		for (const extensionMeta of extensionMetas) {
			if (
				extensionMeta.loadResult === ExtensionLoadResult.Loadable &&
				conflitsIds.has(extensionMeta.id)
			) {
				extensionMeta.loadResult = ExtensionLoadResult.ExtensionIdConflict;
			}
		}
		extensionMetas.sort((a, b) => {
			if (a.loadResult === b.loadResult)
				return a.fileName.localeCompare(b.fileName);

			if (a.loadResult === ExtensionLoadResult.Loadable) return -1;
			if (b.loadResult === ExtensionLoadResult.Loadable) return 1;
			if (a.loadResult === ExtensionLoadResult.Disabled) return -1;
			if (b.loadResult === ExtensionLoadResult.Disabled) return 1;
			return 0;
		});
		return extensionMetas;
	},
	(_get, set) => {
		set(reloadExtensionMetaAtom, Symbol());
	},
);

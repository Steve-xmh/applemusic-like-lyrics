import { atomWithStorage, createJSONStorage } from "jotai/utils";
import type { AsyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import { normalizePath } from "../../utils/path";
import { debounce } from "../../utils/debounce";
import { warn } from "../../utils/logger";
import { Getter, atom } from "jotai";
import { AMLLConfig } from ".";

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
type AMLLStorage = Map<string, any>;
// rome-ignore lint/suspicious/noExplicitAny: <explanation>
async function loadConfig(): Promise<Map<string, any>> {
	try {
		// rome-ignore lint/suspicious/noExplicitAny: <explanation>
		let storeValue: any;
		if ("betterncm" in window) {
			const configPath = normalizePath(
				`${plugin.mainPlugin.pluginPath}/../../amll-data/amll-settings.json`,
			);
			storeValue = JSON.parse(await betterncm.fs.readFileText(configPath));
		} else {
			// rome-ignore lint/style/noNonNullAssertion: <explanation>
			// rome-ignore lint/suspicious/noExtraNonNullAssertion: <explanation>
			storeValue = JSON.parse(localStorage.getItem("amll-config")!!);
		}
		return new Map(Object.entries(storeValue));
	} catch (err) {
		warn("配置文件加载失败", err);
	}
	return new Map();
}

// rome-ignore lint/suspicious/noExplicitAny: <explanation>
const saveConfig = debounce(async (config: Map<string, any>) => {
	// rome-ignore lint/suspicious/noExplicitAny: <explanation>
	const storeValue: any = {};
	config.forEach((v, k) => {
		storeValue[k] = v;
	});
	if ("betterncm" in window) {
		const configPath = normalizePath(
			`${plugin.mainPlugin.pluginPath}/../../amll-data/amll-settings.json`,
		);
		await betterncm.fs.writeFile(
			configPath,
			JSON.stringify(storeValue, null, 4),
		);
	} else {
		localStorage.setItem("amll-config", JSON.stringify(storeValue));
	}
}, 1000);

const amllStorageLoadedAtom = atom(false);
const rawAMLLStorageAtom = atom<AMLLStorage>(new Map());
const amllStorageAtom = atom<Promise<AMLLStorage>, [AMLLStorage], void>(
	async (get, opt) => {
		if (!get(amllStorageLoadedAtom)) {
			opt.setSelf(await loadConfig());
		}
		return get(rawAMLLStorageAtom);
	},
	(get, set, update: AMLLStorage) => {
		if (get(amllStorageLoadedAtom)) {
			saveConfig(update);
		} else {
			set(amllStorageLoadedAtom, true);
		}
		set(rawAMLLStorageAtom, new Map(update.entries()));
	},
);

export interface ConfigInfo<Value> {
	key: string;
	desc: string;
	default: Value;
}

function atomWithConfigInner<Value>(info: ConfigInfo<Value>) {
	return atom<Promise<Value>, [Value], Promise<void>>(
		async (get) => {
			const storage = await get(amllStorageAtom);
			return storage.get(info.key) ?? info.default;
		},
		async (get, set, update) => {
			const map = await get(amllStorageAtom);
			map.set(info.key, update);
			set(amllStorageAtom, map);
		},
	);
}

export function atomWithConfig<Value>(info: ConfigInfo<Value>) {
	return {
		...atomWithConfigInner(info),
		info,
	};
}

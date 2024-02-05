import { loadable, selectAtom } from "jotai/utils";
import { normalizePath } from "../../utils/path";
import { debounce } from "../../utils/debounce";
import { log, warn } from "../../utils/logger";
import { type WritableAtom, atom } from "jotai";
import { Loadable } from "jotai/vanilla/utils/loadable";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type AMLLStorage = Map<string, any>;
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
async function loadConfig(): Promise<Map<string, any>> {
	try {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		let storeValue: any;
		if ("betterncm" in window) {
			const configPath = normalizePath(
				`${plugin.mainPlugin.pluginPath}/../../amll-data/amll-settings.json`,
			);
			storeValue = JSON.parse(await betterncm.fs.readFileText(configPath));
		} else {
			// biome-ignore lint/style/noNonNullAssertion: <explanation>
			// biome-ignore lint/suspicious/noExtraNonNullAssertion: <explanation>
			storeValue = JSON.parse(localStorage.getItem("amll-config")!!);
		}
		return new Map(Object.entries(storeValue));
	} catch (err) {
		warn("配置文件加载失败", err);
	}
	return new Map();
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const saveConfig = debounce(async (config: Map<string, any>) => {
	try {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const storeValue: any = {};
		config.forEach((v, k) => {
			storeValue[k] = v;
		});
		if ("betterncm" in window) {
			const configPath = normalizePath(
				`${plugin.mainPlugin.pluginPath}/../../amll-data/amll-settings.json`,
			);
			const configFolderPath = normalizePath(`${configPath}/..`);
			if (!(await betterncm.fs.exists(configFolderPath))) {
				await betterncm.fs.mkdir(configFolderPath);
			}
			await betterncm.fs.writeFile(
				configPath,
				JSON.stringify(storeValue, null, 4),
			);
		} else {
			localStorage.setItem("amll-config", JSON.stringify(storeValue));
		}
		log("配置文件保存成功");
	} catch (err) {
		warn("配置文件保存失败", err);
	}
}, 1000);

export const amllStorageLoadedAtom = atom(false);
const rawAMLLStorageAtom = atom<AMLLStorage>(new Map());
const amllStorageAtom = atom<AMLLStorage, [AMLLStorage], void>(
	(get, opt) => {
		if (!get(amllStorageLoadedAtom)) {
			loadConfig().then((v) => opt.setSelf(v));
			// opt.setSelf(await loadConfig());
		}
		return get(rawAMLLStorageAtom);
	},
	(get, set, update: AMLLStorage) => {
		if (get(amllStorageLoadedAtom)) {
			saveConfig(update);
		} else {
			set(amllStorageLoadedAtom, true);
		}
		const cloned = new Map(update.entries());
		set(rawAMLLStorageAtom, cloned);
	},
);

export interface ConfigInfo<Value> {
	key: string;
	desc: string;
	default: Value;
}

export interface LoadableConfigInfo<Value> extends ConfigInfo<Value> {
	loadable: true;
}

function atomWithConfigInner<Value>(
	info: LoadableConfigInfo<Value>,
): WritableAtom<Loadable<Value>, [Value], void>;
function atomWithConfigInner<Value>(
	info: ConfigInfo<Value>,
): WritableAtom<Value, [Value], void>;
function atomWithConfigInner<Value>(
	info: ConfigInfo<Value> | LoadableConfigInfo<Value>,
) {
	const select = selectAtom(
		amllStorageAtom,
		(v): Value => v.get(info.key) ?? info.default,
		(a, b) => (void (a !== b && log("compare", info.key, a, b)), a === b),
	);
	const orig = atom(
		(get) => get(select) as Value,
		(get, set, update: Value) => {
			const map = get(amllStorageAtom);
			map.set(info.key, update);
			log("已设置", info.key, update);
			set(amllStorageAtom, map);
		},
	);
	const load = atom((get) => {
		const initLoaded = get(amllStorageLoadedAtom);
		const data = get(orig);
		if (initLoaded) {
			return {
				state: "hasData",
				data: data,
			} as Loadable<Value>;
		}
		return {
			state: "loading",
		} as Loadable<Value>;
	});
	if ("loadable" in info && info.loadable) {
		const derived = atom(
			(get) => get(load),
			(_get, set, update: Value) => {
				set(orig, update);
			},
		);
		return derived;
	}
	const derived = atom(
		(get) => {
			const loadableValue = get(load);
			if (loadableValue.state === "hasData") {
				return loadableValue.data;
			}
			return info.default;
		},
		(_get, set, update: Value) => {
			set(orig, update);
		},
	);
	return derived;
}

export function atomWithConfig<Value>(
	info: LoadableConfigInfo<Value>,
): WritableAtom<Loadable<Value>, [Value], void>;
export function atomWithConfig<Value>(
	info: ConfigInfo<Value>,
): WritableAtom<Value, [Value], void>;
export function atomWithConfig<Value>(
	info: ConfigInfo<Value> | LoadableConfigInfo<Value>,
) {
	return {
		...atomWithConfigInner(info),
		info,
	};
}

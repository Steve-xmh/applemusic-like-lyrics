import { loadable, selectAtom } from "jotai/utils";
import { normalizePath } from "../../utils/path";
import { debounce } from "../../utils/debounce";
import { warn } from "../../utils/logger";
import { type WritableAtom, atom } from "jotai";
import { Loadable } from "jotai/vanilla/utils/loadable";

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
		(a, b) => a === b,
	);
	const orig = atom<Promise<Value>, [Value], Promise<void>>(
		(get) => get(select),
		async (get, set, update) => {
			const map = await get(amllStorageAtom);
			map.set(info.key, update);
			set(amllStorageAtom, map);
		},
	);
	const load = loadable(orig);
	if ("loadable" in info && info.loadable) {
		return load;
	} else {
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

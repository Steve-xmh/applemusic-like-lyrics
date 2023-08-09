import { atomWithStorage } from "jotai/utils";
import type { AsyncStorage } from "jotai/vanilla/utils/atomWithStorage";
import { normalizePath } from "../../utils/path";
import { debounce } from "../../utils/debounce";

class AMLLConfigStorage<Value> implements AsyncStorage<Value> {
	private currentValue: Map<string, Value> = new Map();
	private loaded = false;
	private readonly saveConfig: () => void;
	constructor() {
		this.saveConfig = debounce(async () => {
			const storeValue: any = {};
			this.currentValue.forEach((v, k) => {
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
	}

	private async loadConfig() {
		if (this.loaded) return;
		try {
			let storeValue: any;
			if ("betterncm" in window) {
				const configPath = normalizePath(
					`${plugin.mainPlugin.pluginPath}/../../amll-data/amll-settings.json`,
				);
				storeValue = JSON.parse(await betterncm.fs.readFileText(configPath));
			} else {
				storeValue = JSON.parse(localStorage.getItem("amll-config")!!);
			}
			this.currentValue = new Map(Object.entries(storeValue));
		} catch {}
		this.loaded = true;
	}

	async getItem(key: string, initialValue: Value): Promise<Value> {
		await this.loadConfig();
		if (this.currentValue.has(key)) return this.currentValue.get(key)!!;
		else return initialValue;
	}

	async removeItem(key: string): Promise<void> {
		this.currentValue.delete(key);
		this.saveConfig();
	}

	async setItem(key: string, newValue: Value): Promise<void> {
		this.currentValue.set(key, newValue);
		this.saveConfig();
	}
}

const storage = new AMLLConfigStorage();

export interface ConfigInfo<Value> {
	key: string;
	desc: string;
	default: Value;
}

function atomWithConfigInner<Value>(info: ConfigInfo<Value>) {
	return atomWithStorage(
		info.key,
		info.default,
		storage as AMLLConfigStorage<Value>,
	);
}

export function atomWithConfig<Value>(info: ConfigInfo<Value>) {
	return {
		...atomWithConfigInner(info),
		info,
	};
}

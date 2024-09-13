import { type Update, check } from "@tauri-apps/plugin-updater";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export const isChechingUpdateAtom = atom(false);
export const updateInfoAtom = atom<Update | false>(false);

export const checkUpdateAtom = atom(null, async (get, set) => {
	set(isChechingUpdateAtom, true);
	const oldUpdateInfo = get(updateInfoAtom);
	if (oldUpdateInfo) {
		try {
			await oldUpdateInfo.close();
		} catch {}
	}
	set(updateInfoAtom, false);
	try {
		const update = await check();
		console.log("检查更新返回结果", update);
		set(updateInfoAtom, update || false);
	} catch (e) {
		console.warn("检查更新失败", e);
	} finally {
		set(isChechingUpdateAtom, false);
	}
});

export const autoUpdateAtom = atomWithStorage("amll-player.autoUpdate", true);

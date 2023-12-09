import { atom } from "jotai";

export enum ConnectionColor {
	Disabled = "#aaaaaa",
	Connecting = "#fdcf1b",
	Active = "#36be36",
	Error = "#d01010",
}

export const wsConnectionStatusAtom = atom({
	color: ConnectionColor.Disabled,
	progress: false,
	text: "未开启",
});

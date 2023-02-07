import { BackgroundRenderMethod } from "../render";
import fragmentShaderCode from "./monterey-wannabe.frag";

export const MontereyWannaBe: BackgroundRenderMethod = {
	label: "Monterey 山峦效果",
	description: "酷似 macOS Monterey 的流动山峦效果",
	value: "monterey-wannabe",
	fragmentShaderCode,
	afterDrawArray() {
		this.shouldRedraw();
	},
};

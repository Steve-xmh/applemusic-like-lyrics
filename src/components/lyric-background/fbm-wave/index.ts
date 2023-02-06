import { BackgroundRenderMethod } from "../render";
import fragmentShaderCode from "./fbm-wave-shader.frag";

export const FBMWaveMethod: BackgroundRenderMethod = {
	label: "流体效果",
	description: "酷似 Apple Music 的背景效果",
	value: "fmb-wave",
	fragmentShaderCode,
	afterDrawArray() {
		this.shouldRedraw();
	},
};

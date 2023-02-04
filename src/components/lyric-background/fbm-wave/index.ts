import { BackgroundRenderMethod } from "../render";
import fragmentShaderCode from "./fbm-wave-shader.frag";

export const FBMWaveMethod: BackgroundRenderMethod = {
	name: "流体效果",
	id: "fmb-wave",
	fragmentShaderCode,
	afterDrawArray() {
		this.shouldRedraw();
	},
};

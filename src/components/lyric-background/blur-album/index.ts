import { BackgroundRenderMethod } from "../render";
import fragmentShaderCode from "./blur-shader.frag";

export const BlurAlbumMethod: BackgroundRenderMethod = {
	label: "模糊专辑图片效果",
	description: "仅显示模糊的专辑图片",
	value: "blur-album",
	fragmentShaderCode,
	afterDrawArray() {},
	configurableUniforms: [""],
};

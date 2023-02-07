import { BackgroundRenderMethod } from "../render";
import fragmentShaderCode from "./blur-shader.frag";

export const BlurAlbumMethod: BackgroundRenderMethod = {
	label: "专辑图片效果",
	description: "仅显示专辑图片",
	value: "blur-album",
	fragmentShaderCode,
	afterDrawArray() {},
};

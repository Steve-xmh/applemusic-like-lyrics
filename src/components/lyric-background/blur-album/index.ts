import { BackgroundRenderMethod } from "../render";
import fragmentShaderCode from "./blur-shader.frag";

export const BlurAlbumMethod: BackgroundRenderMethod = {
	label: "专辑图片效果",
	description: "显示专辑图片，可以设置模糊程度",
	value: "blur-album",
	fragmentShaderCode,
	afterDrawArray() {},
};

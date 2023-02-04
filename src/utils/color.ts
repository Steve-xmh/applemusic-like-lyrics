import { Pixel } from "../libs/color-quantize/utils";
import { hsv, rgb } from "color-convert";

/**
 * 将过亮和过暗的颜色的明度进行限制，有助于作为背景配色时保证文字便于阅读
 * @param color 需要进行变换的颜色
 * @returns 返回一个经过调整的颜色
 */
export const normalizeColor = (color: Pixel): Pixel => {
	const hsvColor = rgb.hsv.raw(color);

	hsvColor[2] = Math.min(80, Math.max(20, hsvColor[2]));

	return hsv.rgb(hsvColor);
};

/**
 * 根据底色计算出最适合观察的对比色，通常用于彩色背景的文字显示上
 * @param color 颜色
 * @returns 最适合观察的对比色
 */
export const getContrastYiq = (color: Pixel): Pixel => {
	const [r, g, b] = color.map((v) => v / 0xff);
	const yiq = (255 * (r * 299 + g * 587 + b * 114)) / 1000;
	if (yiq >= 128) {
		return [0, 0, 0];
	} else {
		return [0xff, 0xff, 0xff];
	}
};

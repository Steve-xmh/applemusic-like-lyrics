/**
 * @fileoverview
 * 背景渲染的输出色彩空间。
 *
 * 浏览器侧的现状：WebGL 的绘制缓冲只能声明 `srgb` 或 `display-p3`
 * （`WebGLRenderingContext.drawingBufferColorSpace`），拿不到 PQ/HLG 这类真正
 * 的 HDR 编码。所以 WebGL 背景能拿到的上限是 **广色域**，而不是亮度上的 HDR；
 * 等绘制缓冲支持 HDR 色彩空间了再往上加。
 *
 * 选择顺序：显示设备能显示 P3 且绘制缓冲能声明 P3 才用 `display-p3`，否则一律
 * 退回 `srgb`。任何一步探测失败都保持旧行为，不支持的设备上画面与以前完全一致。
 */

import {
	isDisplayP3Supported,
	isHdrDisplaySupported,
	isWideGamutDrawingBufferSupported,
} from "./support.ts";

/** 背景渲染器实际写出的色彩空间。 */
export type BackgroundColorSpace = "srgb" | "display-p3";

/**
 * 宿主对输出色彩空间的偏好。
 *
 * `"auto"` 交给设备能力决定；另外两个值用于强制指定（例如设置界面上的开关，
 * 或排查色彩问题时临时关掉广色域）。
 */
export type BackgroundColorSpacePreference = "auto" | BackgroundColorSpace;

/** 当前运行环境在输出色彩空间上的能力。 */
export interface OutputColorSpaceSupport {
	/** 显示设备能呈现比 sRGB 更广的色域（`@media (color-gamut: p3)`）。 */
	wideGamutDisplay: boolean;
	/** 显示设备具备高动态范围（`@media (dynamic-range: high)`）。 */
	hdrDisplay: boolean;
	/** WebGL 绘制缓冲能声明为 `display-p3`。 */
	wideGamutDrawingBuffer: boolean;
}

/**
 * 探测输出色彩空间能力。
 *
 * 这里不额外缓存：三项探测各自在 `support.ts` 里已经缓存过了，重复调用只是把
 * 它们重新装一个对象，不值得为它再加一层状态。
 */
export function getOutputColorSpaceSupport(): OutputColorSpaceSupport {
	return {
		wideGamutDisplay: isDisplayP3Supported(),
		hdrDisplay: isHdrDisplaySupported(),
		wideGamutDrawingBuffer: isWideGamutDrawingBufferSupported(),
	};
}

let preference: BackgroundColorSpacePreference = "auto";

/**
 * 设置输出色彩空间偏好。
 *
 * 渲染器在构造时读取这个值，所以要在创建渲染器之前设置；已经建好的渲染器不会
 * 被改动，需要重建才能生效。
 */
export function setBackgroundColorSpacePreference(
	next: BackgroundColorSpacePreference,
): void {
	preference = next;
}

/** 读取当前的输出色彩空间偏好。 */
export function getBackgroundColorSpacePreference(): BackgroundColorSpacePreference {
	return preference;
}

/**
 * 依偏好与设备能力决定背景应当写出的色彩空间。
 *
 * 强制指定成 `display-p3` 时只要求绘制缓冲认得这个色彩空间：屏幕本身不宽也
 * 没关系，合成器会把它压回屏幕色域，颜色仍然是对的。但绘制缓冲不认的话，写
 * 进去的 P3 数值会被当成 sRGB 解释，颜色就错了，所以这种情况照样退回 `srgb`。
 */
export function detectBackgroundColorSpace(): BackgroundColorSpace {
	if (preference === "srgb") return "srgb";
	const support = getOutputColorSpaceSupport();
	if (!support.wideGamutDrawingBuffer) return "srgb";
	if (preference === "display-p3") return "display-p3";
	return support.wideGamutDisplay ? "display-p3" : "srgb";
}

/**
 * 把色彩空间声明到 WebGL 绘制缓冲上。
 *
 * 只在需要广色域时设置；不支持的环境会静默保持默认的 sRGB。
 */
export function applyDrawingBufferColorSpace(
	gl: WebGLRenderingContext,
	colorSpace: BackgroundColorSpace,
): void {
	if (colorSpace !== "display-p3") return;
	const target = gl as WebGLRenderingContext & {
		drawingBufferColorSpace?: string;
	};
	try {
		target.drawingBufferColorSpace = "display-p3";
	} catch {
		// 规范说非法值会被忽略，多包一层是防某些实现对未知属性直接抛错
	}
}

/**
 * 宽色域模式下额外叠加的饱和度扩张系数。
 *
 * 封面素材本身是 sRGB 的，只做一次正确的色彩管理（sRGB → Display P3）在视觉
 * 上与原来完全一致 —— P3 多出来的那圈色域等于闲着。这个系数就是拿来用它的：
 * 在目标色彩空间里绕亮度扩张一次，原本顶在 sRGB 边界上的颜色因此能再往外走
 * 一点。设为 0 就退化成纯粹的色彩管理，不会有任何观感变化。
 */
export const WIDE_GAMUT_EXPANSION = 0.15;

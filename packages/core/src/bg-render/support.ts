/**
 * @fileoverview
 * 渲染器的运行环境能力探测。
 *
 * 渲染器的构造函数在拿不到所需上下文时会直接抛错，而 `BackgroundRender.new()`
 * 只是 `new` 一下，没有回落余地。所以选择渲染器的一方（设置界面、从
 * localStorage 恢复配置的地方）应当先问一句支不支持。
 */

let webgl1Support: boolean | undefined;
let webgl2Support: boolean | undefined;
let highpFragmentSupport: boolean | undefined;
let displayP3Support: boolean | undefined;
let hdrDisplaySupport: boolean | undefined;
let wideGamutDrawingBufferSupport: boolean | undefined;

/** 跑一次媒体查询，环境里没有 `matchMedia`（例如 SSR）时一律当作不匹配。 */
function mediaMatches(query: string): boolean {
	if (typeof globalThis.matchMedia !== "function") return false;
	try {
		return globalThis.matchMedia(query).matches;
	} catch {
		return false;
	}
}

/**
 * 借一个 1x1 的临时上下文跑一次 `probe`，用完立刻释放。不传 `probe` 就只测能不
 * 能拿到上下文。
 *
 * 拿不到上下文或者探测过程中抛错都算作不支持。
 */
function withProbeContext(
	contextId: "webgl" | "webgl2",
	probe: (gl: WebGLRenderingContext | WebGL2RenderingContext) => boolean = () =>
		true,
): boolean {
	try {
		const canvas = document.createElement("canvas");
		canvas.width = 1;
		canvas.height = 1;
		const gl = canvas.getContext(contextId) as
			| WebGLRenderingContext
			| WebGL2RenderingContext
			| null;
		if (!gl) return false;
		try {
			return probe(gl);
		} finally {
			// 探测用的上下文用完立刻释放，免得白占一个 WebGL 上下文名额
			gl.getExtension("WEBGL_lose_context")?.loseContext();
		}
	} catch {
		return false;
	}
}

/** 当前环境是否支持 WebGL1，结果只探测一次。 */
export function isWebGL1Supported(): boolean {
	if (webgl1Support === undefined) webgl1Support = withProbeContext("webgl");
	return webgl1Support;
}

/** 当前环境是否支持 WebGL2，结果只探测一次。 */
export function isWebGL2Supported(): boolean {
	if (webgl2Support === undefined) webgl2Support = withProbeContext("webgl2");
	return webgl2Support;
}

/**
 * WebGL1 的片元着色器是否支持 highp 浮点，结果只探测一次。
 *
 * 程序化渲染器的着色器里时间项会一直单调累加，噪声哈希又多是
 * `sin(...) * 43758.5453` 这种把误差放大四万倍的写法。mediump 只有 10 位有效
 * 数，播放几分钟后时间项就会量化到肉眼可见的台阶，哈希本身也会退化成条带 ——
 * 与其默默给出破图，不如直接判定为不支持。
 */
export function isHighpFragmentSupported(): boolean {
	if (highpFragmentSupport === undefined) {
		highpFragmentSupport = withProbeContext("webgl", (gl) => {
			const format = gl.getShaderPrecisionFormat(
				gl.FRAGMENT_SHADER,
				gl.HIGH_FLOAT,
			);
			return (format?.precision ?? 0) > 0;
		});
	}
	return highpFragmentSupport;
}

/**
 * 当前显示设备是否能呈现比 sRGB 更广的色域，结果只探测一次。
 *
 * 注意这只说明「屏幕能显示」，不代表绘制缓冲能声明宽色域 —— 两者缺一不可，
 * 判断见 {@link isWideGamutDrawingBufferSupported}。
 */
export function isDisplayP3Supported(): boolean {
	if (displayP3Support === undefined) {
		displayP3Support = mediaMatches("(color-gamut: p3)");
	}
	return displayP3Support;
}

/**
 * 当前显示设备是否具备高动态范围，结果只探测一次。
 *
 * 目前只用于对外播报能力：WebGL 的绘制缓冲还没有 PQ/HLG 这类色彩空间可声明，
 * 所以背景渲染拿不到亮度上的 HDR，`display-p3` 已经是上限。
 */
export function isHdrDisplaySupported(): boolean {
	if (hdrDisplaySupport === undefined) {
		hdrDisplaySupport = mediaMatches("(dynamic-range: high)");
	}
	return hdrDisplaySupport;
}

/**
 * WebGL 的绘制缓冲能否声明成 `display-p3`，结果只探测一次。
 *
 * 赋值后要读回来确认：规范说非法值会被忽略，只有读回来还是 `display-p3`
 * 才说明这版实现真的认这个色彩空间。
 */
export function isWideGamutDrawingBufferSupported(): boolean {
	if (wideGamutDrawingBufferSupport === undefined) {
		wideGamutDrawingBufferSupport = withProbeContext("webgl", (gl) => {
			const target = gl as WebGLRenderingContext & {
				drawingBufferColorSpace?: string;
			};
			if (!("drawingBufferColorSpace" in gl)) return false;
			target.drawingBufferColorSpace = "display-p3";
			return target.drawingBufferColorSpace === "display-p3";
		});
	}
	return wideGamutDrawingBufferSupport;
}

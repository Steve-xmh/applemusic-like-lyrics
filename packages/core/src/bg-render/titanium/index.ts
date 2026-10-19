/**
 * @fileoverview
 * Titanium 背景渲染器。
 *
 * 一个独立于网格渐变的程序化渲染器：
 *
 * - 从封面提取四个主题色（OkLab），在四角柔和混合成平滑的金属渐变；
 * - 画面是一张解析的高度场：一条圆顶的沙脊（脊线两侧一缓一陡）叠着几层很缓的
 *   沙丘起伏，法线由梯度解析求出，整张沙面的明暗就是法线与光向的点积——
 *   迎光面亮、背光面暗，受光面顺着沙丘的起伏还有深浅变化，不是一块平涂；
 * - 明暗交界靠粉末的疏密过渡，脊线本身是一条光滑的解析曲线；
 * - 每粒沙的随机量由格子坐标哈希得出，不依赖任何纹理；每粒沙在沙面法线上再
 *   叠一点随机倾斜，只有恰好把光反射进镜头的沙粒才会亮：闪点由光源方向驱动，
 *   而不是画上去的一层亮点，因此有层次也会随光流动；
 * - 粉末的浓淡同时跟着光照与离脊线的距离走：亮处粒粒可见，离得越远越稀，
 *   暗处只余零星浮尘；
 * - 沙粒沿脊线的切线（法线的垂线）匀速滑动，两侧方向相反、细粒比粗粒略快。
 *   流向在整个画面上是统一的，否则方向差会随运行时间累积成剪切，把沙面拉花；
 * - 锋线相位与颗粒排布在每个渲染器实例内固定；换封面时主题色缓缓过渡，
 *   同时锋线会在若干秒内平滑挪到一个新的随机姿态——整屏明暗跟着移动，
 *   所以这段过渡刻意给得很长，缓动也取首尾极软的一条曲线；
 *   沙纹排布与粒子流向在这段过渡里保持不动，只有光照分布在挪。
 *
 * 性能：合成阶段只有一次全屏绘制、零次纹理采样；颗粒由一个四则运算的哈希
 * 直接算出，不需要预先烘焙纹理。
 */

import { clamp01 } from "#utils/clamp.ts";
import {
	loadResourceFromElement,
	loadResourceFromUrl,
} from "../../utils/resource.ts";
import { BaseRenderer } from "../base.ts";
import { GLProgram } from "../gl-program.ts";
import {
	type ColorVec3,
	createPaletteFromImage,
	type PaletteAlgorithm,
	srgbToOkLab,
} from "../palette/index.ts";
import { isWebGL1Supported } from "../support.ts";
import titaniumFragShader from "./titanium.frag.glsl?raw";
import titaniumVertShader from "./titanium.vert.glsl?raw";

/** Titanium 渲染器的可调选项。 */
export interface TitaniumRendererOptions {
	/** 细颗粒（粉末质感）强度，取值范围 [0, 1]，默认 0.7。 */
	grain: number;
	/** 金属闪粉强度，取值范围 [0, 1]，默认 0.75。 */
	sparkle: number;
	/** 金属高光强度，取值范围 [0, 1]，默认 0.5。 */
	sheen: number;
	/** 金属化程度，向画面亮度去饱和，取值范围 [0, 1]，默认 0.35。 */
	metalness: number;
	/**
	 * 换封面时锋线移动到新姿态所用的时长，单位毫秒，默认 2000。
	 *
	 * 锋线一动，整屏的受光面与粒子密度都会跟着变，所以给得比较长。
	 * 设为 0 表示不做过渡、直接跳到新姿态。
	 */
	crestShiftMs: number;
	/** 是否启用抖动，默认 `true`。 */
	dithering: boolean;
	/** 取色算法，默认 `"auto"`。 */
	paletteAlgorithm: PaletteAlgorithm;
}

/** 渐变用到的颜色数量。 */
const COLOR_COUNT = 4;
/** 换封面时调色板过渡的时长，单位毫秒。 */
const PALETTE_TRANSITION_MS = 1400;
/** 加载封面失败时的重试次数。 */
const ALBUM_RETRY_TIMES = 5;
const TAU = Math.PI * 2;
/** 颜色与光照完成一轮循环所需的流动时间（秒）。 */
const COLOR_CYCLE_SECONDS = 8.0;
/** 粒子沿锋线切线走完一轮所需的流动时间（秒）。 */
const FLOW_CYCLE_SECONDS = 4.0;
/** 粒子每轮沿切线前进的距离，单位是屏幕 UV。 */
const FLOW_LENGTH = 0.04;
/** 默认帧率。 */
const DEFAULT_MAX_FPS = 30;
/** 锋线换位过渡的默认时长（毫秒）。整屏明暗都会变，所以给得比较长。 */
const DEFAULT_CREST_SHIFT_MS = 2000;
/** 锋线纵向偏移的随机范围（画面高度的比例），免得每次都只在水平方向挪。 */
const CREST_SHIFT_Y = 0.12;
/** 低频最强时粒子流速额外增加的比例（0.35 即最多快 35%）。 */
const LOW_FREQ_FLOW_GAIN = 0.35;

/** 还没拿到封面时的中性深色配色，分量取值 [0, 1] 的 sRGB。 */
const DEFAULT_COLORS: ColorVec3[] = [
	[0.13, 0.13, 0.15],
	[0.1, 0.1, 0.12],
	[0.17, 0.17, 0.19],
	[0.11, 0.11, 0.13],
];

/** {@link DEFAULT_COLORS} 的 OkLab 形式，四个颜色首尾相接。 */
const DEFAULT_OKLAB_COLORS = new Float32Array(
	DEFAULT_COLORS.flatMap(srgbToOkLab),
);

function lerp(from: number, to: number, amount: number): number {
	return from + (to - from) * amount;
}

export class TitaniumRenderer extends BaseRenderer {
	/**
	 * 新建实例时采用的默认选项。
	 *
	 * 该对象也可作为配置界面的初始值；实例创建后的调整统一走
	 * {@link setOptions}。
	 */
	static readonly defaultOptions: Readonly<TitaniumRendererOptions> = {
		grain: 0.7,
		sparkle: 0.75,
		sheen: 0.5,
		metalness: 0.35,
		dithering: true,
		paletteAlgorithm: "auto",
		crestShiftMs: DEFAULT_CREST_SHIFT_MS,
	};

	/** 当前环境是否支持该渲染器。 */
	static isSupported(): boolean {
		return isWebGL1Supported();
	}

	private gl: WebGLRenderingContext;
	private program!: GLProgram;
	private quadBuffer!: WebGLBuffer;
	private contextLost = false;
	private _disposed = false;

	private options: TitaniumRendererOptions = {
		...TitaniumRenderer.defaultOptions,
	};

	/** 有歌词时背景要收敛到的程度，逐帧向目标靠拢，不会有突变。 */
	private lyricScrim = 0;
	private lyricScrimTarget = 0;

	/** 目标低频强度（0–1），由 `setLowFreqVolume` 写入。 */
	private volume = 0;
	/** 平滑后的低频强度，实际用于着色器与流速。 */
	private smoothedVolume = 0;

	private tickHandle = 0;
	private lastTickTime = 0;
	private lastFrameTime = 0;
	private frameTime = 0;
	/**
	 * 粒子流独立的时间轴。
	 *
	 * 不能复用 `frameTime`：后者还驱动颜色呼吸，流速变化不应该连带改颜色节奏；
	 * 而且着色器里的偏移用的是「累计时间 × 恒定的 u_flowSpeed」，
	 * 中途改 `u_flowSpeed` 会让相位跳变，所以只能在这里调累加速度。
	 */
	private flowTime = 0;
	private maxFPS = DEFAULT_MAX_FPS;
	private paused = false;
	private staticMode = false;

	private targetWidth = 0;
	private targetHeight = 0;
	private currentWidth = 0;
	private currentHeight = 0;

	private albumRequestId = 0;
	private albumSource?: HTMLImageElement | HTMLVideoElement;

	/**
	 * 调色板过渡已经过的毫秒数。
	 *
	 * 与渲染时钟共用同一套时间，暂停、静态模式或限帧时过渡进度不会和画面对不上。
	 */
	private paletteTransitionElapsed = PALETTE_TRANSITION_MS;
	private readonly fromColors = new Float32Array(DEFAULT_OKLAB_COLORS);
	private readonly toColors = new Float32Array(DEFAULT_OKLAB_COLORS);
	private readonly colorBuffer = new Float32Array(DEFAULT_OKLAB_COLORS);
	private readonly nextColors = new Float32Array(COLOR_COUNT * 3);
	/** 每个渲染器实例固定的随机偏移：颜色扭曲相位与粒子纹理位置。 */
	private readonly seed = new Float32Array(3);
	/**
	 * 锋线的当前姿态：xy 为两个谐波的相位偏移，z 为整体纵向偏移。
	 *
	 * 与 {@link seed} 分开存放，这样换封面时只挪锋线，不牵动沙纹与粒子流。
	 */
	private readonly crestMotion = new Float32Array(3);
	private readonly crestFrom = new Float32Array(3);
	private readonly crestTo = new Float32Array(3);
	/** 锋线换位已经过的毫秒数。 */
	private crestShiftElapsed = 0;
	private readonly grainOffset = new Float32Array(2);
	private readonly paletteOrder = new Uint8Array(COLOR_COUNT);

	constructor(canvas: HTMLCanvasElement) {
		super(canvas);
		const gl = canvas.getContext("webgl", {
			alpha: false,
			antialias: false,
			depth: false,
			stencil: false,
			powerPreference: "low-power",
		});
		if (!gl) {
			this.disconnectResizeObserver();
			throw new Error("WebGL not supported");
		}
		this.gl = gl;
		try {
			this.rollRandomParameters();
			this.initializeGLResources();
		} catch (error) {
			this.program?.dispose();
			gl.getExtension("WEBGL_lose_context")?.loseContext();
			this.disconnectResizeObserver();
			throw error;
		}
		canvas.addEventListener("webglcontextlost", this.onContextLost);
		canvas.addEventListener("webglcontextrestored", this.onContextRestored);
		this.requestTick();
	}

	private initializeGLResources(): void {
		const gl = this.gl;
		this.program = new GLProgram(
			gl,
			titaniumVertShader,
			titaniumFragShader,
			"titanium",
		);
		const buffer = gl.createBuffer();
		if (!buffer) throw new Error("Failed to create quad buffer");
		this.quadBuffer = buffer;
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
			gl.STATIC_DRAW,
		);
		const position = this.program.attrs.a_pos;
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
	}

	private readonly onContextLost = (event: Event): void => {
		event.preventDefault();
		this.contextLost = true;
		if (this.tickHandle) {
			cancelAnimationFrame(this.tickHandle);
			this.tickHandle = 0;
		}
	};

	private readonly onContextRestored = (): void => {
		if (this._disposed) return;
		try {
			this.initializeGLResources();
		} catch (error) {
			this.program?.dispose();
			console.error("Failed to restore WebGL resources", error);
			return;
		}
		this.contextLost = false;
		this.currentWidth = 0;
		this.currentHeight = 0;
		this.resetFrameClock();
		this.requestTick();
	};

	/** 掷一次随机偏移：锋线相位与颗粒纹理位置。整个实例内保持不变。 */
	private rollRandomParameters(): void {
		for (let i = 0; i < this.seed.length; i++) {
			this.seed[i] = Math.random() * TAU;
		}
		this.grainOffset[0] = Math.random();
		this.grainOffset[1] = Math.random();
		this.rollPaletteOrder();
	}

	/** 重排主题色落到四个角上的顺序，每个封面换一次。 */
	private rollPaletteOrder(): void {
		for (let i = 0; i < this.paletteOrder.length; i++) {
			this.paletteOrder[i] = i;
		}
		for (let i = this.paletteOrder.length - 1; i > 0; i--) {
			const swapIndex = Math.floor(Math.random() * (i + 1));
			[this.paletteOrder[i], this.paletteOrder[swapIndex]] = [
				this.paletteOrder[swapIndex],
				this.paletteOrder[i],
			];
		}
	}

	/**
	 * 换封面时掷一个新的锋线姿态，交给 {@link updateCrestMotion} 缓慢过渡过去。
	 *
	 * 只动锋线（明暗分布），不动 {@link seed} 与 `grainOffset`，
	 * 因此沙纹排布与粒子流向在这个过程里保持稳定。
	 */
	private rollCrestTarget(): void {
		// 从当前这一帧的实际姿态接着插值，连续换封面时不会回跳
		this.updateCrestMotion();
		this.crestFrom.set(this.crestMotion);

		// 相位至少扫过四分之一圈，保证每次都能看出锋线确实换了位置；
		// 上限留在一圈之内，免得两个谐波同时接近整圈、终点看起来和起点一样
		for (let i = 0; i < 2; i++) {
			const sweep = (0.25 + Math.random() * 0.6) * TAU;
			this.crestTo[i] =
				this.crestMotion[i] + (Math.random() < 0.5 ? -sweep : sweep);
		}
		this.crestTo[2] = (Math.random() - 0.5) * 2 * CREST_SHIFT_Y;
		this.crestShiftElapsed = 0;
	}

	/**
	 * 按经过时间把锋线姿态插值到目标。
	 *
	 * 缓动用 smootherstep（首尾的一阶、二阶导数都为 0），整屏明暗变化时
	 * 起步与收尾都不会露出生硬的折点。
	 */
	private updateCrestMotion(): void {
		const duration = Math.max(0, this.options.crestShiftMs);
		if (duration <= 0 || this.crestShiftElapsed >= duration) {
			this.crestMotion.set(this.crestTo);
			// 相位以 2π 为周期，收尾时折回一圈之内：sin 对 2π 无感，
			// 画面不会有跳变，但能避免长期累加后 mediump 的精度被吃掉
			for (let i = 0; i < 2; i++) {
				this.crestMotion[i] = ((this.crestMotion[i] % TAU) + TAU) % TAU;
			}
			this.crestTo.set(this.crestMotion);
			return;
		}

		const t = this.crestShiftElapsed / duration;
		const eased = t * t * t * (t * (t * 6 - 15) + 10);
		for (let i = 0; i < this.crestMotion.length; i++) {
			this.crestMotion[i] = lerp(this.crestFrom[i], this.crestTo[i], eased);
		}
	}

	/** 调整渲染器选项，会立即生效。 */
	setOptions(patch: Partial<TitaniumRendererOptions>): void {
		// 逐字段取值而不是对象展开：展开会把 `{ grain: undefined }` 里的
		// undefined 也照搬过来，把已有配置抹成空值
		const previous = this.options;
		const next: TitaniumRendererOptions = {
			grain: clamp01(patch.grain ?? previous.grain),
			sparkle: clamp01(patch.sparkle ?? previous.sparkle),
			sheen: clamp01(patch.sheen ?? previous.sheen),
			metalness: clamp01(patch.metalness ?? previous.metalness),
			dithering: patch.dithering ?? previous.dithering,
			paletteAlgorithm: patch.paletteAlgorithm ?? previous.paletteAlgorithm,
			crestShiftMs: Math.max(0, patch.crestShiftMs ?? previous.crestShiftMs),
		};
		const algorithmChanged =
			next.paletteAlgorithm !== previous.paletteAlgorithm;
		this.options = next;
		if (algorithmChanged && this.albumSource) {
			this.updatePaletteFromSource(this.albumSource, true);
		}
		this.requestTick();
	}

	private updatePaletteFromSource(
		source: HTMLImageElement | HTMLVideoElement,
		immediate = false,
	): void {
		this.rollPaletteOrder();
		let palette: [number, number, number][];
		try {
			palette = createPaletteFromImage(source, COLOR_COUNT, {
				algorithm: this.options.paletteAlgorithm,
				// 背景要的是封面本身的颜色跨度，不是和界面的对比度
				intent: "dominant",
			}).palette;
		} catch (error) {
			// 跨域封面会让 getImageData 抛安全错误，此时保持现有配色
			console.warn("Failed to extract palette from album", error);
			return;
		}
		for (let i = 0; i < COLOR_COUNT; i++) {
			const [red, green, blue] = palette[this.paletteOrder[i]];
			this.nextColors.set(
				srgbToOkLab([red / 255, green / 255, blue / 255]),
				i * 3,
			);
		}
		this.transitionToColors(this.nextColors, immediate);
		this.requestTick();
	}

	private transitionToColors(next: Float32Array, immediate: boolean): void {
		if (immediate) {
			this.fromColors.set(next);
		} else {
			// 从当前这一帧的实际颜色接着往下过渡，免得连续换封面时颜色回跳
			this.updateColorBuffer();
			this.fromColors.set(this.colorBuffer);
		}
		this.toColors.set(next);
		this.paletteTransitionElapsed = immediate ? PALETTE_TRANSITION_MS : 0;
	}

	/** 按当前过渡进度就地更新颜色，不产生任何中间数组。 */
	private updateColorBuffer(): void {
		if (this.paletteTransitionElapsed >= PALETTE_TRANSITION_MS) {
			this.colorBuffer.set(this.toColors);
			return;
		}
		const progress = this.paletteTransitionElapsed / PALETTE_TRANSITION_MS;
		// 余弦缓动：首尾都很软，中段也不会显得急
		const eased = 0.5 - 0.5 * Math.cos(Math.PI * progress);
		for (let i = 0; i < this.colorBuffer.length; i++) {
			this.colorBuffer[i] = lerp(this.fromColors[i], this.toColors[i], eased);
		}
	}

	private checkIfResize(): void {
		if (
			this.targetWidth === this.currentWidth &&
			this.targetHeight === this.currentHeight
		) {
			return;
		}
		super.onResize(this.targetWidth, this.targetHeight);
		this.currentWidth = this.targetWidth;
		this.currentHeight = this.targetHeight;
		this.gl.viewport(0, 0, this.targetWidth, this.targetHeight);
	}

	private onRedraw(frameTime: number, frameDelta: number): boolean {
		this.checkIfResize();
		// 歌词出现/消失时背景在约三分之一秒内缓缓收放
		const scrimStep = Math.min(1, frameDelta / 350);
		this.lyricScrim += (this.lyricScrimTarget - this.lyricScrim) * scrimStep;
		if (this.currentWidth <= 0 || this.currentHeight <= 0) return false;

		if (this.paletteTransitionElapsed < PALETTE_TRANSITION_MS) {
			this.paletteTransitionElapsed += frameDelta;
		}
		this.updateColorBuffer();

		if (this.crestShiftElapsed < this.options.crestShiftMs) {
			this.crestShiftElapsed += frameDelta;
		}
		this.updateCrestMotion();

		const gl = this.gl;
		const program = this.program;
		program.use();
		program.setUniform2f("u_resolution", this.currentWidth, this.currentHeight);
		program.setUniform1f("u_aspect", this.currentWidth / this.currentHeight);
		program.setUniform1f(
			"u_colorTime",
			(frameTime / 1000 / COLOR_CYCLE_SECONDS) % 1,
		);
		// 流动时间直接给持续累加的秒数：位移在着色器里对纹理周期取模，
		// 因此沙面可以一直朝一个方向滑下去，不需要靠两副本交叉淡化来循环。
		// 这个时间在低频出现时会累加得更快，即粒子流速的轻微提升
		program.setUniform1f("u_flowTime", this.flowTime / 1000);
		program.setUniform1f("u_flowSpeed", FLOW_LENGTH / FLOW_CYCLE_SECONDS);
		program.setUniform3fv("u_colors[0]", this.colorBuffer);
		program.setUniform3fv("u_seed", this.seed);
		program.setUniform3fv("u_crestMotion", this.crestMotion);
		program.setUniform2f(
			"u_grainOffset",
			this.grainOffset[0],
			this.grainOffset[1],
		);
		program.setUniform4f(
			"u_metal",
			this.options.grain,
			this.options.sparkle,
			this.options.sheen,
			this.options.metalness,
		);
		program.setUniform1f("u_lyricScrim", this.lyricScrim);
		program.setUniform1f("u_lowFreq", this.smoothedVolume);
		program.setUniform1i("u_enableDithering", this.options.dithering ? 1 : 0);

		gl.drawArrays(gl.TRIANGLES, 0, 6);

		// 调色板过渡、锋线迁移与歌词收敛都跑完之后，才允许静态模式停下来
		return (
			this.paletteTransitionElapsed >= PALETTE_TRANSITION_MS &&
			Math.abs(this.lyricScrimTarget - this.lyricScrim) < 0.001 &&
			this.crestShiftElapsed >= this.options.crestShiftMs
		);
	}

	private onTick(tickTime: number): void {
		this.tickHandle = 0;
		if (this.paused || this._disposed || this.contextLost) return;

		const interval = 1000 / this.maxFPS;
		const delta = tickTime - this.lastTickTime;
		if (delta < interval) {
			this.requestTick();
			return;
		}

		if (Number.isNaN(this.lastFrameTime)) this.lastFrameTime = tickTime;
		// 切后台回来时 delta 会很大，封个顶，否则调色板过渡会一帧跳完
		const frameDelta = Math.min(tickTime - this.lastFrameTime, 250);
		this.lastFrameTime = tickTime;
		this.lastTickTime = tickTime - (delta % interval);

		this.frameTime += frameDelta * this.flowSpeed;
		// 低频值先平滑一档：FFT 是离散帧，直接拿来加减速会有台阶感
		const volumeStep = Math.min(1, frameDelta / 120);
		this.smoothedVolume += (this.volume - this.smoothedVolume) * volumeStep;
		this.flowTime +=
			frameDelta *
			this.flowSpeed *
			(1 + LOW_FREQ_FLOW_GAIN * this.smoothedVolume);

		if (!(this.onRedraw(this.frameTime, frameDelta) && this.staticMode)) {
			this.requestTick();
		} else {
			this.lastFrameTime = Number.NaN;
		}
	}

	private readonly onTickBinded = this.onTick.bind(this);

	private requestTick(): void {
		if (this._disposed || this.paused || this.contextLost) return;
		// 写成 `!(maxFPS > 0)` 而不是 `maxFPS <= 0`，是为了连 NaN 一起挡掉
		if (!(this.maxFPS > 0)) return;
		if (this.tickHandle === 0) {
			this.tickHandle = requestAnimationFrame(this.onTickBinded);
		}
	}

	protected override onResize(width: number, height: number): void {
		this.targetWidth = Math.ceil(width);
		this.targetHeight = Math.ceil(height);
		this.requestTick();
	}

	override setStaticMode(enable: boolean): void {
		this.staticMode = enable;
		this.resetFrameClock();
		this.requestTick();
	}

	override setFPS(fps: number): void {
		this.maxFPS = fps;
		this.resetFrameClock();
		this.requestTick();
	}

	override pause(): void {
		if (this.tickHandle) {
			cancelAnimationFrame(this.tickHandle);
			this.tickHandle = 0;
		}
		this.paused = true;
	}

	override resume(): void {
		this.paused = false;
		this.resetFrameClock();
		this.requestTick();
	}

	private resetFrameClock(): void {
		const now = performance.now();
		this.lastFrameTime = now;
		this.lastTickTime = now;
	}

	private isCurrentAlbumRequest(requestId: number): boolean {
		return (
			!this._disposed && !this.contextLost && requestId === this.albumRequestId
		);
	}

	override async setAlbum(
		albumSource?: string | HTMLImageElement | HTMLVideoElement,
		isVideo?: boolean,
	): Promise<void> {
		const requestId = ++this.albumRequestId;
		if (
			albumSource === undefined ||
			(typeof albumSource === "string" && albumSource.trim().length === 0)
		) {
			this.albumSource = undefined;
			this.transitionToColors(DEFAULT_OKLAB_COLORS, false);
			this.requestTick();
			return;
		}

		let source: HTMLImageElement | HTMLVideoElement | null = null;
		let remainRetryTimes = ALBUM_RETRY_TIMES;
		while (!source && remainRetryTimes > 0) {
			try {
				source =
					typeof albumSource === "string"
						? await loadResourceFromUrl(albumSource, isVideo)
						: await loadResourceFromElement(albumSource);
			} catch (error) {
				if (!this.isCurrentAlbumRequest(requestId)) return;
				remainRetryTimes--;
				console.warn(
					`failed on loading album resource, retrying (${remainRetryTimes})`,
					{ albumSource, error },
				);
			}
		}
		if (!this.isCurrentAlbumRequest(requestId)) return;
		if (!source) {
			console.error("Failed to load album resource", albumSource);
			return;
		}

		this.albumSource = source;
		// 换封面时锋线缓缓挪到新的随机姿态：整屏明暗都会跟着变，
		// 所以过渡时长单独可配（默认 2 秒）
		this.rollCrestTarget();
		// 视频封面只取首帧的主色，避免在主线程上留下周期性卡顿
		this.updatePaletteFromSource(source);
	}

	override setLowFreqVolume(volume: number): void {
		// 低频只做两件事：粒子流略微加速、背景略微变暗（见 onTick 与着色器）。
		// 这里只存目标值，平滑交给 onTick，避免播放器把几十赫兹的跳动直接砸进画面
		this.volume = clamp01(volume);
		// 静态模式就是要画面停下来，此时不再为低频变化重绘
		if (!this.staticMode) this.requestTick();
	}

	override setHasLyric(hasLyric: boolean): void {
		// 有歌词时把背景略收一档、压一压高光，保证白字压得住；
		// 过渡由 onRedraw 里的缓动完成，不会突兀
		this.lyricScrimTarget = hasLyric ? 1 : 0;
		this.requestTick();
	}

	override dispose(): void {
		if (this._disposed) return;
		this._disposed = true;
		if (this.tickHandle) {
			cancelAnimationFrame(this.tickHandle);
			this.tickHandle = 0;
		}
		this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
		this.canvas.removeEventListener(
			"webglcontextrestored",
			this.onContextRestored,
		);
		this.program.dispose();
		this.gl.deleteBuffer(this.quadBuffer);
		this.gl.getExtension("WEBGL_lose_context")?.loseContext();
		super.dispose();
	}
}

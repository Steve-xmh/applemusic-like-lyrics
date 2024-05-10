import { Disposable } from "../interfaces";
import { BaseRenderer } from "./base";
import vertShader from "./shaders/base.vert.glsl?raw";
import fragShader from "./shaders/base.frag.glsl?raw";
import blendShader from "./shaders/blend.frag.glsl?raw";
import eplorShader from "./shaders/eplor.frag.glsl?raw";
import noiseShader from "./shaders/noise.frag.glsl?raw";
import noiseImage from "../assets/noise 5.png?inline";
import {
	loadResourceFromElement,
	loadResourceFromUrl,
} from "../utils/resource";

const NOISE_IMAGE_DATA = (() => {
	const img = document.createElement("img");
	img.src = noiseImage;
	return img;
})();

function blurImage(imageData: ImageData, radius: number, quality: number) {
	const pixels = imageData.data;
	const width = imageData.width;
	const height = imageData.height;

	let rsum: number;
	let gsum: number;
	let bsum: number;
	let asum: number;
	let x: number;
	let y: number;
	let i: number;
	let p: number;
	let p1: number;
	let p2: number;
	let yp: number;
	let yi: number;
	let yw: number;
	const wm = width - 1;
	const hm = height - 1;
	const rad1x = radius + 1;
	const divx = radius + rad1x;
	const rad1y = radius + 1;
	const divy = radius + rad1y;
	const div2 = 1 / (divx * divy);

	const r: number[] = [];
	const g: number[] = [];
	const b: number[] = [];
	const a: number[] = [];

	const vmin: number[] = [];
	const vmax: number[] = [];

	while (quality-- > 0) {
		yw = yi = 0;

		for (y = 0; y < height; y++) {
			rsum = pixels[yw] * rad1x;
			gsum = pixels[yw + 1] * rad1x;
			bsum = pixels[yw + 2] * rad1x;
			asum = pixels[yw + 3] * rad1x;

			for (i = 1; i <= radius; i++) {
				p = yw + ((i > wm ? wm : i) << 2);
				rsum += pixels[p++];
				gsum += pixels[p++];
				bsum += pixels[p++];
				asum += pixels[p];
			}

			for (x = 0; x < width; x++) {
				r[yi] = rsum;
				g[yi] = gsum;
				b[yi] = bsum;
				a[yi] = asum;

				if (y === 0) {
					vmin[x] = Math.min(x + rad1x, wm) << 2;
					vmax[x] = Math.max(x - radius, 0) << 2;
				}

				p1 = yw + vmin[x];
				p2 = yw + vmax[x];

				rsum += pixels[p1++] - pixels[p2++];
				gsum += pixels[p1++] - pixels[p2++];
				bsum += pixels[p1++] - pixels[p2++];
				asum += pixels[p1] - pixels[p2];

				yi++;
			}
			yw += width << 2;
		}

		for (x = 0; x < width; x++) {
			yp = x;
			rsum = r[yp] * rad1y;
			gsum = g[yp] * rad1y;
			bsum = b[yp] * rad1y;
			asum = a[yp] * rad1y;

			for (i = 1; i <= radius; i++) {
				yp += i > hm ? 0 : width;
				rsum += r[yp];
				gsum += g[yp];
				bsum += b[yp];
				asum += a[yp];
			}

			yi = x << 2;
			for (y = 0; y < height; y++) {
				pixels[yi] = (rsum * div2 + 0.5) | 0;
				pixels[yi + 1] = (gsum * div2 + 0.5) | 0;
				pixels[yi + 2] = (bsum * div2 + 0.5) | 0;
				pixels[yi + 3] = (asum * div2 + 0.5) | 0;

				if (x === 0) {
					vmin[y] = Math.min(y + rad1y, hm) * width;
					vmax[y] = Math.max(y - radius, 0) * width;
				}

				p1 = x + vmin[y];
				p2 = x + vmax[y];

				rsum += r[p1] - r[p2];
				gsum += g[p1] - g[p2];
				bsum += b[p1] - b[p2];
				asum += a[p1] - a[p2];

				yi += width << 2;
			}
		}
	}
}

function saturateImage(imageData: ImageData, saturation: number) {
	const pixels = imageData.data;

	for (let i = 0; i < pixels.length; i += 4) {
		const r = pixels[i];
		const g = pixels[i + 1];
		const b = pixels[i + 2];
		const a = pixels[i + 3];
		const gray = r * 0.3 + g * 0.59 + b * 0.11;
		pixels[i] = gray * (1 - saturation) + r * saturation;
		pixels[i + 1] = gray * (1 - saturation) + g * saturation;
		pixels[i + 2] = gray * (1 - saturation) + b * saturation;
		pixels[i + 3] = a;
	}
}

function brightnessImage(imageData: ImageData, brightness: number) {
	const pixels = imageData.data;

	for (let i = 0; i < pixels.length; i += 4) {
		const r = pixels[i];
		const g = pixels[i + 1];
		const b = pixels[i + 2];
		const a = pixels[i + 3];
		pixels[i] = r * brightness;
		pixels[i + 1] = g * brightness;
		pixels[i + 2] = b * brightness;
		pixels[i + 3] = a;
	}
}

function contrastImage(imageData: ImageData, contrast: number) {
	const pixels = imageData.data;

	for (let i = 0; i < pixels.length; i += 4) {
		const r = pixels[i];
		const g = pixels[i + 1];
		const b = pixels[i + 2];
		const a = pixels[i + 3];
		pixels[i] = (r - 128) * contrast + 128;
		pixels[i + 1] = (g - 128) * contrast + 128;
		pixels[i + 2] = (b - 128) * contrast + 128;
		pixels[i + 3] = a;
	}
}

class GLProgram implements Disposable {
	private gl: WebGL2RenderingContext;
	program: WebGLProgram;
	private vertexShader: WebGLShader;
	private fragmentShader: WebGLShader;
	private coordPos: number;
	constructor(
		gl: WebGL2RenderingContext,
		vertexShaderSource: string,
		fragmentShaderSource: string,
		private readonly label = "unknown",
	) {
		this.gl = gl;
		this.vertexShader = this.createShader(gl.VERTEX_SHADER, vertexShaderSource);
		this.fragmentShader = this.createShader(
			gl.FRAGMENT_SHADER,
			fragmentShaderSource,
		);
		this.program = this.createProgram();

		const coordPos = gl.getAttribLocation(this.program, "v_coord");
		if (coordPos === -1)
			throw new Error(
				`Failed to get attribute location v_coord for "${this.label}"`,
			);
		this.coordPos = coordPos;
	}
	private createShader(type: number, source: string) {
		const gl = this.gl;
		const shader = gl.createShader(type);
		if (!shader) throw new Error("Failed to create shader");
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error(
				`Failed to compile shader for type ${type} "${this.label
				}": ${gl.getShaderInfoLog(shader)}`,
			);
		}
		return shader;
	}
	private createProgram() {
		const gl = this.gl;
		const program = gl.createProgram();
		if (!program) throw new Error("Failed to create program");
		gl.attachShader(program, this.vertexShader);
		gl.attachShader(program, this.fragmentShader);
		gl.linkProgram(program);
		gl.validateProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			const errLog = gl.getProgramInfoLog(program);
			gl.deleteProgram(program);
			throw new Error(`Failed to link program "${this.label}": ${errLog}`);
		}
		return program;
	}
	use() {
		const gl = this.gl;
		gl.useProgram(this.program);
		gl.vertexAttribPointer(this.coordPos, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.coordPos);
	}
	private notFoundUniforms: Set<string> = new Set();
	private warnUniformNotFound(name: string) {
		if (this.notFoundUniforms.has(name)) return;
		this.notFoundUniforms.add(name);
		console.warn(
			`Failed to get uniform location for program "${this.label}": ${name}`,
		);
	}
	setUniform1f(name: string, value: number) {
		const gl = this.gl;
		const location = gl.getUniformLocation(this.program, name);
		if (!location) this.warnUniformNotFound(name);
		else gl.uniform1f(location, value);
	}
	setUniform2f(name: string, value1: number, value2: number) {
		const gl = this.gl;
		const location = gl.getUniformLocation(this.program, name);
		if (!location) this.warnUniformNotFound(name);
		else gl.uniform2f(location, value1, value2);
	}
	setUniform1i(name: string, value: number) {
		const gl = this.gl;
		const location = gl.getUniformLocation(this.program, name);
		if (!location) this.warnUniformNotFound(name);
		else gl.uniform1i(location, value);
	}
	dispose() {
		const gl = this.gl;
		gl.deleteShader(this.vertexShader);
		gl.deleteShader(this.fragmentShader);
		gl.deleteProgram(this.program);
	}
}

class Framebuffer implements Disposable {
	private fb: WebGLFramebuffer;
	private tex: WebGLTexture;
	private _size: [number, number];
	get size() {
		return this._size;
	}
	constructor(
		private gl: WebGL2RenderingContext,
		width: number,
		height: number,
	) {
		this._size = [width, height];
		const fb = gl.createFramebuffer();
		if (!fb) throw new Error("Can't create framebuffer");
		const tex = gl.createTexture();
		if (!tex) throw new Error("Failed to create texture");
		this.fb = fb;
		this.tex = tex;
		gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			tex,
			0,
		);
		this.resize(width, height);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
	}
	resize(width: number, height: number) {
		const gl = this.gl;
		this.bind();
		gl.bindTexture(gl.TEXTURE_2D, this.tex);
		if (gl.getExtension("EXT_color_buffer_float")) {
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA32F,
				width,
				height,
				0,
				gl.RGBA,
				gl.FLOAT,
				null,
			);
		} else {
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				width,
				height,
				0,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				null,
			);
		}
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
	}
	bind() {
		const gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
	}
	active(texture: number = this.gl.TEXTURE0) {
		this.gl.activeTexture(texture);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
	}
	dispose(): void {
		this.gl.deleteFramebuffer(this.fb);
		this.gl.deleteTexture(this.tex);
	}
}

class GLBuffer implements Disposable {
	private gl: WebGL2RenderingContext;
	private buffer: WebGLBuffer;
	private type: number;
	private data: ArrayBufferView;
	private usage: number;
	private length: number;
	constructor(
		gl: WebGL2RenderingContext,
		type: number,
		data: ArrayBufferView,
		usage: number,
	) {
		this.gl = gl;
		this.type = type;
		this.data = data;
		this.usage = usage;
		const buffer = gl.createBuffer();
		if (!buffer) throw new Error("Failed to create buffer");
		this.buffer = buffer;
		this.length = data.byteLength;
		gl.bindBuffer(type, this.buffer);
		gl.bufferData(type, data, usage);
	}
	bind() {
		const gl = this.gl;
		gl.bindBuffer(this.type, this.buffer);
	}
	// update(data: ArrayBufferView) {
	//     const gl = this.gl;
	//     gl.bindBuffer(this.type, this.buffer);
	//     gl.bufferSubData(this.type, 0, data);
	//     this.data = data;
	// }
	dispose() {
		const gl = this.gl;
		gl.deleteBuffer(this.buffer);
	}
}

class AlbumTexture implements Disposable {
	private albumTexture: WebGLTexture;
	alpha = 0;

	constructor(
		private gl: WebGL2RenderingContext,
		private mainProgram: GLProgram,
		private vertexBuffer: GLBuffer,
		private indexBuffer: GLBuffer,
		albumImageData: ImageData,
	) {
		const albumTexture = gl.createTexture();
		if (!albumTexture) throw new Error("Failed to create texture");
		this.albumTexture = albumTexture;
		gl.bindTexture(gl.TEXTURE_2D, albumTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			albumImageData,
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
	}

	draw(sampler: string) {
		const gl = this.gl;
		this.mainProgram.use();
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.albumTexture);
		this.mainProgram.setUniform1i(sampler, 0);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	dispose(): void {
		this.gl.deleteTexture(this.albumTexture);
	}
}

class NoiseTexture implements Disposable {
	private tex: WebGLTexture;
	alpha = 0;

	constructor(private gl: WebGL2RenderingContext) {
		const tex = gl.createTexture();
		if (!tex) throw new Error("Failed to create texture");
		this.tex = tex;
		NOISE_IMAGE_DATA.decode().then(() => {
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				NOISE_IMAGE_DATA,
			);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		});
	}

	active(texture: number = this.gl.TEXTURE1) {
		this.gl.activeTexture(texture);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
	}

	dispose(): void {
		this.gl.deleteTexture(this.tex);
	}
}

export class EplorRenderer extends BaseRenderer {
	private hasLyric = true;
	private hasLyricValue = 1;
	private maxFPS = 30;
	private lastTickTime = 0;
	private lastFrameTime = 0;
	private _lowFreqVolume = 1;
	private paused = false;
	private staticMode = false;
	private gl: WebGL2RenderingContext = this.setupGL();
	private reduceImageSizeCanvas = new OffscreenCanvas(32, 32);
	private tickHandle = 0;
	private sprites: AlbumTexture[] = [];
	private ampTransition = 0;
	private playTime = 0;
	private frameTime = 0;
	private IllIlllIlIIlllI: number[] = [-0.1, 0.0];
	private onTick(tickTime: number) {
		this.tickHandle = 0;
		if (this.paused) return;

		const delta = tickTime - this.lastTickTime;
		const frameDelta = tickTime - this.lastFrameTime;
		this.lastFrameTime = tickTime;
		if (delta < 1000 / this.maxFPS) {
			this.requestTick();
			return;
		}

		this.playTime +=
			frameDelta * this.flowSpeed * 0.1 * (this.hasLyricValue * 0.8 + 0.2);
		this.frameTime += frameDelta;

		if (!(this.onRedraw(this.playTime, frameDelta) && this.staticMode)) {
			this.requestTick();
		}

		this.lastTickTime = tickTime;

		this.ampTransition;
	}

	private mainProgram: GLProgram = new GLProgram(
		this.gl,
		vertShader,
		eplorShader,
		"main",
	);
	private blendProgram: GLProgram = new GLProgram(
		this.gl,
		vertShader,
		blendShader,
		"blend",
	);
	private copyProgram: GLProgram = new GLProgram(
		this.gl,
		vertShader,
		fragShader,
		"copy",
	);
	private noiseProgram: GLProgram = new GLProgram(
		this.gl,
		vertShader,
		noiseShader,
		"noise",
	);

	private static readonly rawVertexBuffer = new Float32Array([
		-1, -1, 1, -1, -1, 1, 1, 1,
	]);

	private static readonly rawIndexBuffer = new Uint16Array([0, 1, 2, 1, 2, 3]);

	private vertexBuffer = new GLBuffer(
		this.gl,
		this.gl.ARRAY_BUFFER,
		EplorRenderer.rawVertexBuffer,
		this.gl.STATIC_DRAW,
	);

	private indexBuffer = new GLBuffer(
		this.gl,
		this.gl.ELEMENT_ARRAY_BUFFER,
		EplorRenderer.rawIndexBuffer,
		this.gl.STATIC_DRAW,
	);

	private noiseTexture = new NoiseTexture(this.gl);

	private fb: [Framebuffer, Framebuffer];
	private historyFrameBuffer: Framebuffer[] = [];

	constructor(protected canvas: HTMLCanvasElement) {
		super(canvas);
		const gl = this.gl;
		gl.enable(this.gl.BLEND);
		gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		this.requestTick();
		const bounds = canvas.getBoundingClientRect();
		const width =
			bounds.width * window.devicePixelRatio * this.currerntRenderScale;
		const height =
			bounds.height * window.devicePixelRatio * this.currerntRenderScale;
		this.fb = [
			new Framebuffer(this.gl, width, height),
			new Framebuffer(this.gl, width, height),
		];
		for (const fb of this.fb) {
			fb.bind();
			gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		}
		// this.historyFrameBuffer = new Array(2)
		// 	.fill(0)
		// 	.map(() => new Framebuffer(this.gl, width, height));
		this.onResize(width, height);
	}
	private _currentSize = [0, 0];
	private _targetSize = [0, 0];
	private renderSize = [0, 0];
	private pixelSize = [0, 0];

	protected override onResize(width: number, height: number): void {
		// super.onResize(width, height);
		this._targetSize = [
			Math.max(1, Math.round(width)),
			Math.max(1, Math.round(height)),
		];
		if (this.staticMode) this.requestTick();
	}

	private checkResize() {
		if (
			this._currentSize[0] === this._targetSize[0] &&
			this._currentSize[1] === this._targetSize[1]
		)
			return;
		this._currentSize = [...this._targetSize];
		const [width, height] = this._targetSize;
		const realWidth = Math.round(
			Math.max(width / this.currerntRenderScale, width),
		);
		const realHeight = Math.round(
			Math.max(height / this.currerntRenderScale, height),
		);
		this.renderSize = [width, height];
		this.canvas.width = realWidth;
		this.canvas.height = realHeight;
		this.pixelSize = [realWidth, realHeight];
		this.gl.viewport(0, 0, realWidth, realHeight);
		for (const fb of this.fb) {
			fb.resize(width, height);
		}
		// for (const fb of this.historyFrameBuffer) {
		// 	fb.resize(realWidth, realHeight);
		// }
	}

	private requestTick() {
		if (!this.tickHandle)
			this.tickHandle = requestAnimationFrame((t) => this.onTick(t));
	}

	private drawScreen() {
		this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
	}

	private bindDefaultFrameBuffer() {
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
	}

	private onRedraw(tickTime: number, delta: number) {
		this.checkResize();
		this.hasLyricValue =
			(this.hasLyricValue * 29 + (this.hasLyric ? 1 : 0)) / 30;
		const gl = this.gl;
		this.vertexBuffer.bind();
		this.indexBuffer.bind();

		this.mainProgram.use();
		// this.noiseTexture.active();
		this.mainProgram.setUniform2f(
			"IIlIlIIlIlIllI",
			this.renderSize[0],
			this.renderSize[1],
		);
		this.mainProgram.setUniform1f("lIIIlllllIllIl", tickTime / 1000);
		this.mainProgram.setUniform1f("IIIlllllllIIIllIl", this.hasLyricValue);
		this.mainProgram.setUniform1f(
			"IIIlllIlIIllll",
			this.hasLyric ? this._lowFreqVolume : 0.0,
		);
		if (window.innerWidth > 1024) {
			this.IllIlllIlIIlllI = [-1.3, -0.9];
		} else {
			this.IllIlllIlIIlllI = [-2.4, -1.4];
		}
		this.mainProgram.setUniform2f(
			"IllIlllIlIIlllI",
			this.IllIlllIlIIlllI[0],
			this.IllIlllIlIIlllI[1],
		);
		this.mainProgram.setUniform1f(
			"IIIIIllllllIll",
			window.innerWidth > 1024 ? 1 : 0,
		);
		const [fba, fbb] = this.fb;
		fbb.bind();
		gl.clearColor(0, 0, 0, 0);
		gl.clear(this.gl.COLOR_BUFFER_BIT);

		for (const sprite of this.sprites) {
			fba.bind();
			gl.clearColor(0, 0, 0, 0);
			gl.clear(this.gl.COLOR_BUFFER_BIT);

			this.mainProgram.use();
			sprite.draw("IlllIIlIlllIll");

			fbb.bind();

			this.blendProgram.use();
			fba.active();
			this.blendProgram.setUniform1i("src", 0);
			this.blendProgram.setUniform1f("lerp", sprite.alpha);
			this.blendProgram.setUniform1f("scale", this.currerntRenderScale);
			this.drawScreen();

			sprite.alpha = Math.min(1, sprite.alpha + delta / 300);
		}

		// 增加噪点以缓解色带现象
		this.noiseProgram.use();
		this.noiseProgram.setUniform1i("src", 0);
		// this.noiseProgram.setUniform2f(
		// 	"renderSize",
		// 	this.renderSize[0],
		// 	this.renderSize[1],
		// );
		// this.noiseProgram.setUniform1f("frameTime", this.frameTime);
		fba.bind();
		fbb.active();
		this.bindDefaultFrameBuffer();
		this.drawScreen();

		if (this.sprites.length > 1) {
			const coveredIndex = this.sprites[this.sprites.length - 1];
			if (coveredIndex.alpha >= 1) {
				for (const deleted of this.sprites.splice(0, this.sprites.length - 1)) {
					deleted.dispose();
				}
			}
		}
		const isOnlyOneSprite =
			this.sprites.length === 1 && this.sprites[0].alpha >= 1;
		const isTweeningValues = this.hasLyric
			? this.hasLyricValue > 0.1
			: this.hasLyricValue < 0.9;
		return isOnlyOneSprite || !isTweeningValues;
	}

	private copyFrameBuffer(src: Framebuffer, dst: Framebuffer | null = null) {
		if (src === dst) return;
		src.active(this.gl.TEXTURE0);
		this.copyProgram.use();
		if (dst) {
			dst.bind();
		} else {
			this.bindDefaultFrameBuffer();
		}
		this.copyProgram.setUniform1i("src", 0);
		// this.copyProgram.setUniform1f("scale", scale);
		this.drawScreen();
	}

	private setupGL() {
		const gl = this.canvas.getContext("webgl2", {
			alpha: true,
			depth: false,
			powerPreference: "low-power",
		});
		if (!gl) throw new Error("WebGL2 not supported");
		this.gl = gl;
		gl.enable(gl.BLEND);
		gl.disable(gl.DEPTH_TEST);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		if (!gl.getExtension("EXT_color_buffer_float"))
			console.warn("EXT_color_buffer_float not supported");
		if (!gl.getExtension("EXT_float_blend"))
			console.warn("EXT_float_blend not supported");
		if (!gl.getExtension("OES_texture_float_linear"))
			console.warn("OES_texture_float_linear not supported");

		return gl;
	}

	override setLowFreqVolume(volume: number): void {
		this._lowFreqVolume = volume;
	}

	override setStaticMode(enable: boolean): void {
		this.staticMode = enable;
		this.lastFrameTime = performance.now();
		this.requestTick();
	}
	override setFPS(fps: number): void {
		this.maxFPS = fps;
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
		this.requestTick();
	}
	override async setAlbum(
		albumSource: string | HTMLImageElement | HTMLVideoElement,
		isVideo = false,
	): Promise<void> {
		if (typeof albumSource === "string" && albumSource.trim().length === 0)
			throw new Error("Empty album url");
		let res: HTMLImageElement | HTMLVideoElement | null = null;
		let remainRetryTimes = 5;
		console.log("setAlbum", albumSource);
		while (!res && remainRetryTimes > 0) {
			try {
				if (typeof albumSource === "string") {
					res = await loadResourceFromUrl(albumSource, isVideo);
				} else {
					res = await loadResourceFromElement(albumSource);
				}
			} catch (error) {
				console.warn(
					`failed on loading album resource, retrying (${remainRetryTimes})`,
					{
						albumSource,
						error,
					},
				);
				remainRetryTimes--;
			}
		}
		console.log("loaded album resource", res);
		if (!res) return;
		// resize image
		const c = this.reduceImageSizeCanvas;
		const ctx = c.getContext("2d");
		if (!ctx) throw new Error("Failed to create canvas context");
		ctx.clearRect(0, 0, c.width, c.height);
		// const baseFilter = "saturate(3) contrast(0.8) saturate(8) brightness(0.4)";
		const blurRadius = 2;
		// Safari 不支持 filter
		// ctx.filter = baseFilter;
		const imgw =
			res instanceof HTMLVideoElement ? res.videoWidth : res.naturalWidth;
		const imgh =
			res instanceof HTMLVideoElement ? res.videoHeight : res.naturalHeight;
		if (imgw * imgh === 0) throw new Error("Invalid image size");
		ctx.drawImage(res, 0, 0, imgw, imgh, 0, 0, c.width, c.height);
		// ctx.fillStyle = "white";
		// ctx.fillRect(0, 0, c.width, c.height);
		const imageData = ctx.getImageData(0, 0, c.width, c.height);
		contrastImage(imageData, 0.4);
		saturateImage(imageData, 3.0);
		//		contrastImage(imageData, 0.8);
		//		brightnessImage(imageData, 0.9);
		blurImage(imageData, blurRadius, 4);
		const sprite = new AlbumTexture(
			this.gl,
			this.mainProgram,
			this.vertexBuffer,
			this.indexBuffer,
			imageData,
		);
		this.sprites.push(sprite);
		// this.playTime = Math.random() * 100000;
		// this.playTime = 0;
		this.lastFrameTime = performance.now();
		// const r = Number.parseInt((Math.random() * 10000).toFixed(0)) % 3;
		// if (r === 0) {
		// 	this.IllIlllIlIIlllI = [-1.3, -0.9];
		// 	// this.IllIlllIlIIlllI = [-1.1, -.9];
		// } else if (r === 1) {
		// 	// this.IllIlllIlIIlllI = [-1.3, -0.9];
		// 	this.IllIlllIlIIlllI = [-1.1, -0.9];
		// 	// this.IllIlllIlIIlllI = [-0.25, -0.2];
		// } else {
		// 	this.IllIlllIlIIlllI = [-1.3, -0.9];
		// }
		// this.requestTick();
	}

	override setHasLyric(hasLyric: boolean): void {
		this.hasLyric = hasLyric;
		this.requestTick();
	}

	override getElement(): HTMLElement {
		return this.canvas;
	}
	override dispose(): void {
		super.dispose();
		this.vertexBuffer.dispose();
		this.indexBuffer.dispose();
		// this.noiseTexture.dispose();
		for (const s of this.sprites) {
			s.dispose();
		}
		// this.copyProgram.dispose();
		this.blendProgram.dispose();
		this.mainProgram.dispose();
		this.noiseProgram.dispose();
		for (const fb of this.fb) {
			fb.dispose();
		}
		// for (const fb of this.historyFrameBuffer) {
		// 	fb.dispose();
		// }
		if (this.tickHandle) {
			cancelAnimationFrame(this.tickHandle);
			this.tickHandle = 0;
		}
	}
}

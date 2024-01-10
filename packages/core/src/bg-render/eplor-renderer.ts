import { Disposable } from "../interfaces";
import { BaseRenderer } from "./base";
import vertShader from "./shaders/base.vert.glsl";
import fragShader from "./shaders/base.frag.glsl";
import blendShader from "./shaders/blend.frag.glsl";
import eplorShader from "./shaders/eplor.frag.glsl";
import { ConsoleLogger } from "typedoc/dist/lib/utils";
import { RandomIdentifierGenerator } from "vite-plugin-top-level-await/dist/utils/random-identifier";

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
	private gl: WebGLRenderingContext;
	program: WebGLProgram;
	private vertexShader: WebGLShader;
	private fragmentShader: WebGLShader;
	private coordPos: number;
	constructor(
		gl: WebGLRenderingContext,
		vertexShaderSource: string,
		fragmentShaderSource: string,
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
			throw new Error("Failed to get attribute location v_coord");
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
				`Failed to compile shader for type ${type}: ${gl.getShaderInfoLog(
					shader,
				)}`,
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
			throw new Error(`Failed to link program: ${errLog}`);
		}
		return program;
	}
	use() {
		const gl = this.gl;
		gl.useProgram(this.program);
		gl.vertexAttribPointer(this.coordPos, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(this.coordPos);
	}
	setUniform1f(name: string, value: number) {
		const gl = this.gl;
		const location = gl.getUniformLocation(this.program, name);
		if (!location) console.warn(`Failed to get uniform location: ${name}`);
		else gl.uniform1f(location, value);
	}
	setUniform2f(name: string, value1: number, value2: number) {
		const gl = this.gl;
		const location = gl.getUniformLocation(this.program, name);
		if (!location) console.warn(`Failed to get uniform location: ${name}`);
		else gl.uniform2f(location, value1, value2);
	}
	setUniform1i(name: string, value: number) {
		const gl = this.gl;
		const location = gl.getUniformLocation(this.program, name);
		if (!location) console.warn(`Failed to get uniform location: ${name}`);
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
	constructor(
		private gl: WebGLRenderingContext,
		width: number,
		height: number,
	) {
		const fb = gl.createFramebuffer();
		if (!fb) throw new Error("Can't create framebuffer");
		const tex = gl.createTexture();
		if (!tex) throw new Error("Failed to create texture");
		this.fb = fb;
		this.tex = tex;
		this.resize(width, height);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
	}
	resize(width: number, height: number) {
		const gl = this.gl;
		this.bind();
		gl.viewport(0, 0, width, height);
		gl.bindTexture(gl.TEXTURE_2D, this.tex);
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
	bind() {
		const gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			this.tex,
			0,
		);
	}
	active(texture: number = this.gl.TEXTURE0) {
		this.gl.activeTexture(texture);
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
	}
	dispose(): void {
		this.gl.deleteFramebuffer(this.fb);
	}
}

class GLBuffer implements Disposable {
	private gl: WebGLRenderingContext;
	private buffer: WebGLBuffer;
	private type: number;
	private data: ArrayBufferView;
	private usage: number;
	private length: number;
	constructor(
		gl: WebGLRenderingContext,
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
		private gl: WebGLRenderingContext,
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

export class EplorRenderer extends BaseRenderer {
	private hasLyric = true;
	private hasLyricValue = 1;
	private maxFPS = 30;
	private lastTickTime = 0;
	private lastFrameTime = 0;
	private _lowFreqVolume = 1;
	private paused = false;
	private staticMode = false;
	private gl: WebGLRenderingContext = this.setupGL();
	private reduceImageSizeCanvas = new OffscreenCanvas(64, 64);
	private tickHandle = 0;
	private sprites: AlbumTexture[] = [];
	private ampTransition = 0;
	private playTime = 0;
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

		if (this.hasLyric) this.playTime += frameDelta * this.flowSpeed;

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
	);
	private blendProgram: GLProgram = new GLProgram(
		this.gl,
		vertShader,
		blendShader,
	);
	private copyProgram: GLProgram = new GLProgram(
		this.gl,
		vertShader,
		fragShader,
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

	private fb: [Framebuffer, Framebuffer];

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
		this.fb.forEach((fb) => {
			fb.bind();
			gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
		});
		this.onResize(width, height);
	}

	protected override onResize(width: number, height: number): void {
		super.onResize(width, height);
		this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
		this.gl.viewport(0, 0, width, height);
		for (const fb of this.fb) {
			fb.resize(width, height);
		}
		this.mainProgram.use();
		this.mainProgram.setUniform2f("IIlIlIIlIlIllI", width, height);
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
		this.hasLyricValue =
			(this.hasLyricValue * 19 + (this.hasLyric ? 1 : 0)) / 20;
		const gl = this.gl;
		this.vertexBuffer.bind();
		this.indexBuffer.bind();

		this.mainProgram.use();
		this.mainProgram.setUniform1f("lIIIlllllIllIl", tickTime / 1000);
		this.mainProgram.setUniform1f("IIIlllllllIIIllIl", this.hasLyricValue);
		this.mainProgram.setUniform1f(
			"IIIlllIlIIllll",
			this.hasLyric ? this._lowFreqVolume : 0.0,
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
			this.drawScreen();

			sprite.alpha = Math.min(1, sprite.alpha + delta / 200);
		}

		this.bindDefaultFrameBuffer();
		this.copyProgram.use();
		fbb.active();
		this.copyProgram.setUniform1i("src", 0);
		this.drawScreen();

		if (this.sprites.length > 1) {
			const coveredIndex = this.sprites[this.sprites.length - 1];
			if (coveredIndex.alpha >= 1) {
				for (const deleted of this.sprites.splice(0, this.sprites.length - 1)) {
					deleted.dispose();
				}
			}
		}
		return this.sprites.length === 1 && this.sprites[0].alpha >= 1;
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
	private loadImage(imageUrl: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const img = document.createElement("img");
			img.onload = () => resolve(img);
			img.onerror = reject;
			img.src = imageUrl;
			img.crossOrigin = "anonymous";
		});
	}
	override async setAlbumImage(albumUrl: string): Promise<void> {
		if (albumUrl.trim().length === 0) return;
		let remainRetryTimes = 5;
		let img: HTMLImageElement | null = null;
		while (!img && remainRetryTimes > 0) {
			try {
				img = await this.loadImage(albumUrl);
			} catch (error) {
				console.warn(
					`failed on loading album image, retrying (${remainRetryTimes})`,
					albumUrl,
					error,
				);
				remainRetryTimes--;
			}
		}
		if (!img) return;
		// resize image
		const c = this.reduceImageSizeCanvas;
		const ctx = c.getContext("2d");
		if (!ctx) throw new Error("Failed to create canvas context");
		ctx.clearRect(0, 0, c.width, c.height);
		// const baseFilter = "saturate(3) contrast(0.8) saturate(8) brightness(0.4)";
		const blurRadius = 4;
		// Safari 不支持 filter
		// ctx.filter = baseFilter;
		const imgw = img.naturalWidth;
		const imgh = img.naturalHeight;
		ctx.drawImage(img, 0, 0, imgw, imgh, 0, 0, c.width, c.height);
		// ctx.fillStyle = "white";
		// ctx.fillRect(0, 0, c.width, c.height);
		const imageData = ctx.getImageData(0, 0, c.width, c.height);
		contrastImage(imageData, 0.8);
		saturateImage(imageData, 1.5);
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
		if (this.hasLyric) this.playTime = 80000;
		else this.playTime = 0;
		this.lastFrameTime = performance.now();
		this.requestTick();
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
		this.sprites.forEach((v) => v.dispose());
		this.copyProgram.dispose();
		this.blendProgram.dispose();
		this.mainProgram.dispose();
		if (this.tickHandle) {
			cancelAnimationFrame(this.tickHandle);
			this.tickHandle = 0;
		}
	}
}

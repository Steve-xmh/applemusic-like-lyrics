import { Disposable } from "../interfaces";
import { BaseRenderer } from "./base";
import vertShader from "./shaders/base.vert.glsl";
import fragShader from "./shaders/base.frag.glsl";
import blendShader from "./shaders/blend.frag.glsl";
import eplorShader from "./shaders/eplor.frag.glsl";

function blurImage(imageData: ImageData, radius: number, quality: number) {
	const pixels = imageData.data;
	const width = imageData.width;
	const height = imageData.height;

	let rsum, gsum, bsum, asum, x, y, i, p, p1, p2, yp, yi, yw;
	const wm = width - 1;
	const hm = height - 1;
	const rad1x = radius + 1;
	const divx = radius + rad1x;
	const rad1y = radius + 1;
	const divy = radius + rad1y;
	const div2 = 1 / (divx * divy);

	const r = [];
	const g = [];
	const b = [];
	const a = [];

	const vmin = [];
	const vmax = [];

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

				if (y == 0) {
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

				if (x == 0) {
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
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
		const coordPos = gl.getAttribLocation(mainProgram.program, "v_coord");
		gl.vertexAttribPointer(coordPos, 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(coordPos);
	}

	draw(sampler: string) {
		const gl = this.gl;
		this.vertexBuffer.bind();
		this.indexBuffer.bind();
		this.mainProgram.use();
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.albumTexture);
		this.mainProgram.setUniform1i(sampler, 1);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}

	dispose(): void {
		this.gl.deleteTexture(this.albumTexture);
	}
}

export class EplorRenderer extends BaseRenderer {
	private maxFPS = 30;
	private lastTickTime = 0;
	private randomOffset = Math.random() * 1000;
	private paused = false;
	private staticMode = false;
	private gl: WebGLRenderingContext = this.setupGL();
	private reduceImageSizeCanvas = new OffscreenCanvas(512, 512);
	private tickHandle = 0;
	private sprites: AlbumTexture[] = [];
	private onTick(tickTime: number) {
		this.tickHandle = 0;
		if (this.paused) return;

		const delta = tickTime - this.lastTickTime;
		if (!this.staticMode) this.requestTick();
		if (delta < 1000 / this.maxFPS) {
			return;
		}

		this.onRedraw(tickTime);

		this.lastTickTime = tickTime;
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

	protected override onResize(width: number, height: number): void {
		super.onResize(width, height);
		console.log("onResize", width, height);
		this.gl.viewport(0, 0, width, height);
		this.mainProgram.use();
		this.mainProgram.setUniform2f("IIlIlIIlIlIllI", width, height);
	}

	private requestTick() {
		if (!this.tickHandle)
			this.tickHandle = requestAnimationFrame((t) => this.onTick(t));
	}

	private onRedraw(tickTime: number) {
		this.gl.clearColor(0, 0, 0, 1);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.mainProgram.setUniform1f("lIIIlllllIllIl", tickTime / 1000);
		for (const sprite of this.sprites) {
			sprite.draw("IlllIIlIlllIll");
		}
	}

	constructor(protected canvas: HTMLCanvasElement) {
		super(canvas);
		this.gl.enable(this.gl.BLEND);
		this.requestTick();
		const bounds = canvas.getBoundingClientRect();
		this.onResize(
			bounds.width * window.devicePixelRatio * this.currerntRenderScale,
			bounds.height * window.devicePixelRatio * this.currerntRenderScale,
		);
	}

	private setupGL() {
		const gl = this.canvas.getContext("webgl2", {
			alpha: true,
			depth: false,
			powerPreference: "low-power",
		});
		if (!gl) throw new Error("WebGL2 not supported");
		this.gl = gl;
		return gl;
	}

	override setStaticMode(enable: boolean): void {
		this.staticMode = enable;
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
		console.log("setAlbumImage", albumUrl);
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
		const blurRadius = 50;
		// Safari 不支持 filter
		// ctx.filter = baseFilter;
		const imgw = img.naturalWidth;
		const imgh = img.naturalHeight;
		ctx.drawImage(img, 0, 0, imgw, imgh, 0, 0, c.width, c.height);
		// ctx.fillStyle = "white";
		// ctx.fillRect(0, 0, c.width, c.height);
		const imageData = ctx.getImageData(0, 0, c.width, c.height);
		contrastImage(imageData, 0.8);
		brightnessImage(imageData, 0.9);
		blurImage(imageData, blurRadius, 1);
		const sprite = new AlbumTexture(
			this.gl,
			this.mainProgram,
			this.vertexBuffer,
			this.indexBuffer,
			imageData,
		);
		console.log(imageData, sprite);
		this.sprites.push(sprite);
		this.randomOffset = Math.random() * 1000;
		this.requestTick();
	}

	override getElement(): HTMLElement {
		return this.canvas;
	}
}

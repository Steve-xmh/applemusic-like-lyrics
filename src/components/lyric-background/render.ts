import { Pixel } from "../../libs/color-quantize/utils";
import { log } from "../../utils/logger";
import fbmWaveShader from "./fbm-wave-shader.frag";

const DEFAULT_VERTEX_SHADER =
	"attribute vec4 a_position;" +
	"void main(){" +
	"gl_Position = a_position;" +
	"}";

const EMPTY_128_F32_ARRAY = new Float32Array(128);

const smallestPowOfTwo = (b: number) =>
	Math.max(2, Math.ceil(Math.log2(Math.log2(b))));
const shuffleArray = <T>(array: T[]) => {
	let currentIndex = array.length;
	let randomIndex: number;

	while (currentIndex !== 0) {
		// Pick a remaining element.
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex],
			array[currentIndex],
		];
	}

	return array;
};
export class CanvasBackgroundRender {
	private disposed = false;
	private gl: WebGLRenderingContext;
	private frameId = 0;
	private createTime = Date.now();
	private get time() {
		return Date.now() - this.createTime;
	}
	constructor(readonly canvas: HTMLCanvasElement) {
		const gl = canvas.getContext("webgl");
		if (gl) {
			this.gl = gl;
			this.resize();
			this.rebuildVertex();
			this.rebuildShader(fbmWaveShader);
			this.rebuildProgram();
			this.setAlbumColorMap([[0, 0, 0]]);
		} else {
			throw new TypeError(
				"你的网易云不支持 WebGL ！有可能是需要开启 GPU 硬件加速或电脑硬件不支持！",
			);
		}
	}
	resize(width = this.canvas.width, height = this.canvas.height) {
		const canvas = this.canvas;
		canvas.width = width;
		canvas.height = height;
		this.gl.viewport(0, 0, canvas.width, canvas.height);
	}
	onUpdateAndDraw() {
		this.frameId = 0;
		this.updateUniforms();

		const gl = this.gl;
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		this.shouldRedraw();
	}
	shouldRedraw() {
		if (!this.frameId) {
			this.frameId = requestAnimationFrame(this.onFrame);
		}
	}
	dispose() {
		if (this.frameId) {
			cancelAnimationFrame(this.frameId);
			this.frameId = 0;
		}
		this.disposed = true;
	}
	private readonly onFrame = () => {
		if (!this.disposed) {
			this.onUpdateAndDraw();
		}
	};
	private vertexBuffer: WebGLBuffer;
	private rebuildVertex() {
		const gl = this.gl;
		if (this.vertexBuffer) gl.deleteBuffer(this.vertexBuffer);

		const buffer = gl.createBuffer();
		if (!buffer) throw new TypeError("顶点缓冲区创建失败！");
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([
				-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0,
			]),
			gl.STATIC_DRAW,
		);

		this.vertexBuffer = buffer;
	}
	private vshader: WebGLShader;
	private fshader: WebGLShader;
	private rebuildShader(
		fragmentSource: string,
		vertexSource = DEFAULT_VERTEX_SHADER,
	) {
		const gl = this.gl;
		if (this.vshader) gl.deleteShader(this.vshader);
		if (this.fshader) gl.deleteShader(this.fshader);

		const vshader = gl.createShader(gl.VERTEX_SHADER);
		if (!vshader) throw new TypeError("顶点着色器创建失败！");

		gl.shaderSource(vshader, vertexSource);
		gl.compileShader(vshader);

		if (!gl.getShaderParameter(vshader, gl.COMPILE_STATUS)) {
			const error = gl.getShaderInfoLog(vshader) || "未知编译错误";
			throw new TypeError("顶点着色器编译失败：\n\n" + error);
		}

		const fshader = gl.createShader(gl.FRAGMENT_SHADER);

		if (!fshader) throw new TypeError("片段着色器创建失败！");

		gl.shaderSource(fshader, fragmentSource);
		gl.compileShader(fshader);

		if (!gl.getShaderParameter(fshader, gl.COMPILE_STATUS)) {
			const error = gl.getShaderInfoLog(fshader) || "未知编译错误";
			throw new TypeError("片段着色器编译失败：\n\n" + error);
		}

		this.vshader = vshader;
		this.fshader = fshader;
	}
	private program: WebGLProgram;
	private rebuildProgram() {
		const gl = this.gl;
		if (this.program) gl.deleteProgram(this.program);

		const program = gl.createProgram();

		if (!program) throw new TypeError("渲染程序句柄创建失败！");

		gl.attachShader(program, this.vshader);
		gl.attachShader(program, this.fshader);
		gl.linkProgram(program);
		gl.useProgram(program);

		const posLoc = gl.getAttribLocation(program, "a_position");
		if (posLoc === -1)
			throw new TypeError("无法找到渲染程序顶点着色器中的 a_position 属性！");
		gl.enableVertexAttribArray(posLoc);
		gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

		this.program = program;
	}
	private albumColorMapSize = 0;
	private albumColorMapTex: WebGLTexture;
	setAlbumColorMap(colorMap: Pixel[]) {
		this.createTime -= 600 * 1000;
		const tmp = [...colorMap];
		shuffleArray(tmp);
		const size = Math.pow(2, smallestPowOfTwo(tmp.length));
		const pixelsData: number[] = [];

		let ci = 0;
		for (let i = 0; i < size * size; i++) {
			const p = tmp[i % tmp.length];
			pixelsData.push(p[0], p[1], p[2], 0xff);
			ci++;
			if (ci >= tmp.length) {
				shuffleArray(tmp);
				ci = 0;
			}
		}

		log(
			"已创建颜色数量为",
			tmp.length,
			"色图尺寸为",
			size,
			"像素数量为",
			pixelsData.length / 4,
			"的材质",
			pixelsData,
		);

		this.albumColorMapSize = size;
		this.albumColorMapTex = this.rebuildTextureFromPixels(
			this.gl.TEXTURE1,
			this.albumColorMapSize,
			new Uint8Array(pixelsData),
			this.albumColorMapTex,
		);
	}
	private albumImageSize = [0, 0];
	private albumImageTex: WebGLTexture;
	setAlbumImage(image: HTMLImageElement) {
		this.albumImageSize = [image.width, image.height];
		this.albumImageTex = this.rebuildTextureFromImage(
			this.gl.TEXTURE2,
			image,
			this.albumImageTex,
		);
	}
	private rebuildTextureFromImage(
		id: GLenum,
		image: HTMLImageElement,
		existTexture?: WebGLTexture,
	) {
		const gl = this.gl;
		if (existTexture) gl.deleteTexture(existTexture);
		const tex = gl.createTexture();
		if (!tex) throw new TypeError("材质句柄创建失败！");
		gl.activeTexture(id);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		return tex;
	}
	private rebuildTextureFromPixels(
		id: GLenum,
		size: number,
		pixelsData: Uint8Array,
		existTexture?: WebGLTexture,
	) {
		if (!Number.isInteger(Math.log2(size)))
			throw new TypeError("材质大小不是二的次幂！");
		const gl = this.gl;
		if (existTexture) gl.deleteTexture(existTexture);
		const tex = gl.createTexture();
		if (!tex) throw new TypeError("材质句柄创建失败！");
		gl.activeTexture(id);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			size,
			size,
			0,
			gl.RGBA,
			gl.UNSIGNED_BYTE,
			pixelsData,
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		return tex;
	}
	private updateUniforms() {
		const gl = this.gl;
		// 着色器开始运行到现在的时间，单位秒
		{
			const loc = gl.getUniformLocation(this.program, "time");
			if (loc) gl.uniform1f(loc, this.time / 1000);
		}
		// 绘制画板的大小，单位像素
		{
			const loc = gl.getUniformLocation(this.program, "resolution");
			if (loc) gl.uniform2f(loc, this.canvas.width, this.canvas.height);
		}
		// 从专辑图片中取色得出的特征色表图
		{
			const loc = gl.getUniformLocation(this.program, "albumColorMap");
			if (loc) gl.uniform1i(loc, 1);
		}
		// 特征色表图的分辨率，单位像素
		{
			const loc = gl.getUniformLocation(this.program, "albumColorMapRes");
			if (loc)
				gl.uniform2f(loc, this.albumColorMapSize, this.albumColorMapSize);
		}
		// 专辑图片
		{
			const loc = gl.getUniformLocation(this.program, "albumImage");
			if (loc) gl.uniform1i(loc, 0);
		}
		// 专辑图片的大小，单位像素
		{
			const loc = gl.getUniformLocation(this.program, "albumImageRes");
			if (loc)
				gl.uniform2f(loc, this.albumImageSize[0], this.albumImageSize[1]);
		}
		// TODO: 当前音频的波形数据缓冲区
		{
			const loc = gl.getUniformLocation(this.program, "audioWaveBuffer");
			if (loc) gl.uniform1fv(loc, EMPTY_128_F32_ARRAY);
		}
		// TODO: 当前音频的可视化数据缓冲区
		{
			const loc = gl.getUniformLocation(this.program, "audioFFTBuffer");
			if (loc) gl.uniform1fv(loc, EMPTY_128_F32_ARRAY);
		}
	}
}

/**
 * @fileoverview
 * 基于 Mesh Gradient 渐变渲染的渲染器
 * 此渲染应该是 Apple Music 使用的背景渲染方式了
 * 参考内容 https://movingparts.io/gradient-meshes
 */

import { Mat4, Vec2, Vec3, Vec4 } from "gl-matrix";
import type { Disposable } from "../../interfaces";
import {
	loadResourceFromElement,
	loadResourceFromUrl,
} from "../../utils/resource";
import { BaseRenderer } from "../base";
import {
	blurImage,
	brightnessImage,
	contrastImage,
	saturateImage,
} from "../img";
import blendFragShader from "./blend.frag.glsl?raw";
import blendVertShader from "./blend.vert.glsl?raw";
import blurFragShader from "./blur.frag.glsl?raw";
import blurVertShader from "./blur.vert.glsl?raw";
import { CONTROL_POINT_PRESETS } from "./cp-presets";
import meshFragShader from "./mesh.frag.glsl?raw";
import meshVertShader from "./mesh.vert.glsl?raw";

type RenderingContext = WebGLRenderingContext;

class GLProgram implements Disposable {
	private gl: RenderingContext;
	program: WebGLProgram;
	private vertexShader: WebGLShader;
	private fragmentShader: WebGLShader;
	readonly attrs: { [name: string]: number };
	constructor(
		gl: RenderingContext,
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

		const num = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
		const attrs: { [name: string]: number } = {};
		for (let i = 0; i < num; i++) {
			const info = gl.getActiveAttrib(this.program, i);
			if (!info) continue;
			const location = gl.getAttribLocation(this.program, info.name);
			if (location === -1) continue;
			attrs[info.name] = location;
		}
		this.attrs = attrs;
	}
	private createShader(type: number, source: string) {
		const gl = this.gl;
		const shader = gl.createShader(type);
		if (!shader) throw new Error("Failed to create shader");
		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			throw new Error(
				`Failed to compile shader for type ${type} "${
					this.label
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

class Mesh implements Disposable {
	protected vertexWidth = 0;
	protected vertexHeight = 0;
	private vertexBuffer: WebGLBuffer;
	private indexBuffer: WebGLBuffer;
	private vertexData: Float32Array;
	private indexData: Uint16Array;
	private vertexIndexLength = 0;
	// 调试用途，开启线框模式
	private wireFrame = false;
	constructor(
		private readonly gl: RenderingContext,
		private readonly attrPos: number | undefined,
		private readonly attrColor: number | undefined,
		private readonly attrUV: number | undefined,
	) {
		const vertexBuf = gl.createBuffer();
		if (!vertexBuf) throw new Error("Failed to create vertex buffer");
		this.vertexBuffer = vertexBuf;
		const indexBuf = gl.createBuffer();
		if (!indexBuf) throw new Error("Failed to create index buffer");
		this.indexBuffer = indexBuf;

		this.bind();

		this.vertexData = new Float32Array(0);
		this.indexData = new Uint16Array(0);

		this.resize(2, 2);
		this.update();
	}

	setWireFrame(enable: boolean) {
		this.wireFrame = enable;
		this.resize(this.vertexWidth, this.vertexHeight);
	}

	setVertexPos(vx: number, vy: number, x: number, y: number): void {
		const idx = (vx + vy * this.vertexWidth) * 7;
		if (idx >= this.vertexData.length - 1) {
			console.warn("Vertex position out of range", idx, this.vertexData.length);
			return;
		}
		this.vertexData[idx] = x;
		this.vertexData[idx + 1] = y;
	}

	setVertexColor(
		vx: number,
		vy: number,
		r: number,
		g: number,
		b: number,
	): void {
		const idx = (vx + vy * this.vertexWidth) * 7 + 2;
		if (idx >= this.vertexData.length - 1) {
			console.warn("Vertex position out of range", idx, this.vertexData.length);
			return;
		}
		this.vertexData[idx] = r;
		this.vertexData[idx + 1] = g;
		this.vertexData[idx + 2] = b;
	}

	setVertexUV(vx: number, vy: number, x: number, y: number): void {
		const idx = (vx + vy * this.vertexWidth) * 7 + 2 + 3;
		if (idx >= this.vertexData.length - 1) {
			console.warn("Vertex position out of range", idx, this.vertexData.length);
			return;
		}
		this.vertexData[idx] = x;
		this.vertexData[idx + 1] = y;
	}

	getVertexIndexLength(): number {
		return this.vertexIndexLength;
	}

	draw() {
		const gl = this.gl;

		if (this.wireFrame) {
			gl.drawElements(gl.LINES, this.vertexIndexLength, gl.UNSIGNED_SHORT, 0);
		} else {
			gl.drawElements(
				gl.TRIANGLES,
				this.vertexIndexLength,
				gl.UNSIGNED_SHORT,
				0,
			);
		}
	}

	resize(vertexWidth: number, vertexHeight: number): void {
		this.vertexWidth = vertexWidth;
		this.vertexHeight = vertexHeight;
		// 2 个顶点坐标 + 3 个颜色值 + 2 个 UV 坐标
		this.vertexIndexLength = vertexWidth * vertexHeight * 6;
		if (this.wireFrame) {
			this.vertexIndexLength = vertexWidth * vertexHeight * 10;
		}
		const vertexData = new Float32Array(
			vertexWidth * vertexHeight * (2 + 3 + 2),
		);
		const indexData = new Uint16Array(this.vertexIndexLength);
		this.vertexData = vertexData;
		this.indexData = indexData;
		for (let y = 0; y < vertexHeight; y++) {
			for (let x = 0; x < vertexWidth; x++) {
				const px = (x / (vertexWidth - 1)) * 2 - 1;
				const py = (y / (vertexHeight - 1)) * 2 - 1;
				this.setVertexPos(x, y, px || 0, py || 0);
				this.setVertexColor(x, y, 1, 1, 1);
				this.setVertexUV(x, y, x / (vertexWidth - 1), y / (vertexHeight - 1));
			}
		}
		for (let y = 0; y < vertexHeight - 1; y++) {
			for (let x = 0; x < vertexWidth - 1; x++) {
				if (this.wireFrame) {
					const idx = (y * vertexWidth + x) * 10;

					indexData[idx] = y * vertexWidth + x;
					indexData[idx + 1] = y * vertexWidth + x + 1;

					indexData[idx + 2] = y * vertexWidth + x + 1;
					indexData[idx + 3] = (y + 1) * vertexWidth + x;

					indexData[idx + 4] = (y + 1) * vertexWidth + x;
					indexData[idx + 5] = (y + 1) * vertexWidth + x + 1;

					indexData[idx + 6] = (y + 1) * vertexWidth + x + 1;
					indexData[idx + 7] = y * vertexWidth + x + 1;

					indexData[idx + 8] = y * vertexWidth + x;
					indexData[idx + 9] = (y + 1) * vertexWidth + x;
				} else {
					const idx = (y * vertexWidth + x) * 6;
					indexData[idx] = y * vertexWidth + x;
					indexData[idx + 1] = y * vertexWidth + x + 1;
					indexData[idx + 2] = (y + 1) * vertexWidth + x;
					indexData[idx + 3] = y * vertexWidth + x + 1;
					indexData[idx + 4] = (y + 1) * vertexWidth + x + 1;
					indexData[idx + 5] = (y + 1) * vertexWidth + x;
				}
			}
		}
		const gl = this.gl;
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexData, gl.STATIC_DRAW);
	}

	bind() {
		const gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

		if (this.attrPos !== undefined) {
			gl.vertexAttribPointer(this.attrPos, 2, gl.FLOAT, false, 4 * 7, 0);
			gl.enableVertexAttribArray(this.attrPos);
		}
		if (this.attrColor !== undefined) {
			gl.vertexAttribPointer(this.attrColor, 3, gl.FLOAT, false, 4 * 7, 4 * 2);
			gl.enableVertexAttribArray(this.attrColor);
		}
		if (this.attrUV !== undefined) {
			gl.vertexAttribPointer(this.attrUV, 2, gl.FLOAT, false, 4 * 7, 4 * 5);
			gl.enableVertexAttribArray(this.attrUV);
		}
	}

	update() {
		const gl = this.gl;
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.DYNAMIC_DRAW);
	}

	dispose(): void {
		this.gl.deleteBuffer(this.vertexBuffer);
		this.gl.deleteBuffer(this.indexBuffer);
	}
}

class ControlPoint {
	color = Vec3.fromValues(1, 1, 1);
	location = Vec2.fromValues(0, 0);
	uTangent = Vec2.fromValues(0, 0);
	vTangent = Vec2.fromValues(0, 0);
	private _uRot = 0;
	private _vRot = 0;
	private _uScale = 1;
	private _vScale = 1;

	constructor() {
		Object.seal(this);
	}

	get uRot() {
		return this._uRot;
	}

	get vRot() {
		return this._vRot;
	}

	set uRot(value: number) {
		this._uRot = value;
		this.updateUTangent();
	}

	set vRot(value: number) {
		this._vRot = value;
		this.updateVTangent();
	}

	get uScale() {
		return this._uScale;
	}

	get vScale() {
		return this._vScale;
	}

	set uScale(value: number) {
		this._uScale = value;
		this.updateUTangent();
	}

	set vScale(value: number) {
		this._vScale = value;
		this.updateVTangent();
	}

	private updateUTangent() {
		this.uTangent[0] = Math.cos(this._uRot) * this._uScale;
		this.uTangent[1] = Math.sin(this._uRot) * this._uScale;
	}

	private updateVTangent() {
		this.vTangent[0] = -Math.sin(this._vRot) * this._vScale;
		this.vTangent[1] = Math.cos(this._vRot) * this._vScale;
	}
}

const H = Mat4.fromValues(2, -2, 1, 1, -3, 3, -2, -1, 0, 0, 1, 0, 1, 0, 0, 0);
const H_T = Mat4.clone(H).transpose();

const spUx = Vec4.create();
const spUy = Vec4.create();
const spV = Vec4.create();

const spxAcc = Mat4.create();
const spyAcc = Mat4.create();
function surfacePoint(
	u: number,
	v: number,
	X: Mat4,
	Y: Mat4,
	output = Vec2.create(),
): Vec2 {
	spUx[0] = u ** 3;
	spUx[1] = u ** 2;
	spUx[2] = u;
	spUx[3] = 1;

	spUy.copy(spUx);

	spV[0] = v ** 3;
	spV[1] = v ** 2;
	spV[2] = v;
	spV[3] = 1;

	spxAcc.copy(X).transpose();
	Mat4.mul(spxAcc, spxAcc, H);
	Mat4.mul(spxAcc, H_T, spxAcc);
	Vec4.transformMat4(spUx, spUx, spxAcc);
	const x = spV.dot(spUx);

	spyAcc.copy(Y).transpose();
	Mat4.mul(spyAcc, spyAcc, H);
	Mat4.mul(spyAcc, H_T, spyAcc);
	Vec4.transformMat4(spUy, spUy, spyAcc);
	const y = spV.dot(spUy);

	output.x = x;
	output.y = y;
	return output;
}

function meshCoefficients(
	p00: ControlPoint,
	p01: ControlPoint,
	p10: ControlPoint,
	p11: ControlPoint,
	axis: "x" | "y",
	output = Mat4.create(),
): Mat4 {
	const l = (p: ControlPoint) => p.location[axis];
	const u = (p: ControlPoint) => p.uTangent[axis];
	const v = (p: ControlPoint) => p.vTangent[axis];

	output[0] = l(p00);
	output[1] = l(p01);
	output[2] = v(p00);
	output[3] = v(p01);
	output[4] = l(p10);
	output[5] = l(p11);
	output[6] = v(p10);
	output[7] = v(p11);
	output[8] = u(p00);
	output[9] = u(p01);
	output[10] = 0;
	output[11] = 0;
	output[12] = u(p10);
	output[13] = u(p11);
	output[14] = 0;
	output[15] = 0;

	return output;
}

function colorCoefficients(
	p00: ControlPoint,
	p01: ControlPoint,
	p10: ControlPoint,
	p11: ControlPoint,
	axis: "r" | "g" | "b",
	output = Mat4.create(),
): Mat4 {
	const c = (p: ControlPoint) => p.color[axis];
	output.fill(0);
	output[0] = c(p00);
	output[1] = c(p01);
	output[4] = c(p10);
	output[5] = c(p11);
	// return Mat4.fromValues(
	//     c(p00), c(p01), 0, 0,
	//     c(p10), c(p11), 0, 0,
	//     0, 0, 0, 0,
	//     0, 0, 0, 0,
	// );
	return output;
}

// 将这个函数要用到的临时变量提取到外部，尽量避免资源分配提高性能
const cpUx = Vec4.create();
const cpUy = Vec4.create();
const cpUz = Vec4.create();

const cpV = Vec4.create();

const cprAcc = Mat4.create();
const cpgAcc = Mat4.create();
const cpbAcc = Mat4.create();
const cpResult = Vec3.create();
function colorPoint(u: number, v: number, R: Mat4, G: Mat4, B: Mat4): Vec3 {
	cpUx[0] = u ** 3;
	cpUx[1] = u ** 2;
	cpUx[2] = u;
	cpUx[3] = 1;
	cpUy.copy(cpUx);
	cpUz.copy(cpUx);

	cpV[0] = v ** 3;
	cpV[1] = v ** 2;
	cpV[2] = v;
	cpV[3] = 1;

	cprAcc.copy(R).transpose();
	Mat4.mul(cprAcc, cprAcc, H);
	Mat4.mul(cprAcc, H_T, cprAcc);
	Vec4.transformMat4(cpUx, cpUx, cprAcc);
	cpResult.r = cpV.dot(cpUx);

	cpgAcc.copy(G).transpose();
	Mat4.mul(cpgAcc, cpgAcc, H);
	Mat4.mul(cpgAcc, H_T, cpgAcc);
	Vec4.transformMat4(cpUy, cpUy, cpgAcc);
	cpResult.g = cpV.dot(cpUy);

	cpbAcc.copy(B).transpose();
	Mat4.mul(cpbAcc, cpbAcc, H);
	Mat4.mul(cpbAcc, H_T, cpbAcc);
	Vec4.transformMat4(cpUz, cpUz, cpbAcc);
	cpResult.b = cpV.dot(cpUz);

	return cpResult;
}

class Map2D<T> {
	private _width = 0;
	private _height = 0;
	private _data: T[] = [];
	constructor(width: number, height: number) {
		this.resize(width, height);
		Object.seal(this);
	}
	resize(width: number, height: number) {
		this._width = width;
		this._height = height;
		this._data = new Array(width * height).fill(0);
	}
	set(x: number, y: number, value: T) {
		this._data[x + y * this._width] = value;
	}
	get(x: number, y: number) {
		return this._data[x + y * this._width];
	}
	get width() {
		return this._width;
	}
	get height() {
		return this._height;
	}
}

// Bicubic Hermite Patch Mesh
class BHPMesh extends Mesh {
	/**
	 * 细分级别，越大曲线越平滑，但是性能消耗也越大
	 */
	private _subDivisions = 10;
	private _controlPoints: Map2D<ControlPoint> = new Map2D(3, 3);

	constructor(
		gl: RenderingContext,
		attrPos: number,
		attrColor: number,
		attrUV: number,
	) {
		super(gl, attrPos, attrColor, attrUV);
		this.resizeControlPoints(3, 3);
		Object.seal(this);
	}
	override setWireFrame(enable: boolean) {
		super.setWireFrame(enable);
		this.updateMesh();
	}
	/**
	 * 以当前的控制点矩阵大小和细分级别为参考重新设置细分级别，此操作不会重设控制点数据
	 * @param subDivisions 细分级别
	 */
	resetSubdivition(subDivisions: number) {
		this._subDivisions = subDivisions;
		super.resize(
			(this._controlPoints.width - 1) * subDivisions,
			(this._controlPoints.height - 1) * subDivisions,
		);
	}
	/**
	 * 重设控制点矩阵尺寸，将会重置所有控制点的颜色和坐标数据
	 * 请在调用此方法后重新设置颜色和坐标，并调用 updateMesh 方法更新网格
	 * @param width 控制点宽度数量，必须大于等于 2
	 * @param height 控制点高度数量，必须大于等于 2
	 */
	resizeControlPoints(width: number, height: number) {
		if (!(width >= 2 && height >= 2)) {
			throw new Error("Control points must be larger than 3x3 or equal");
		}
		this._controlPoints.resize(width, height);
		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const point = new ControlPoint();
				point.location.x = (x / (width - 1)) * 2 - 1;
				point.location.y = (y / (height - 1)) * 2 - 1;
				point.uTangent.x = 2 / (width - 1);
				point.vTangent.y = 2 / (height - 1);
				this._controlPoints.set(x, y, point);
			}
		}
		this.resetSubdivition(this._subDivisions);
	}
	/**
	 * 获取指定位置的控制点，然后可以设置颜色和坐标属性
	 * 留意颜色属性和坐标属性的值范围均参考 WebGL 的定义
	 * 即颜色各个组件取值 [0-1]，坐标取值 [-1, 1]
	 * 点的位置以画面左下角为原点 (0,0)
	 * @param x 需要获取的控制点的 x 坐标
	 * @param y 需要获取的控制点的 y 坐标
	 * @returns 控制点对象
	 */
	getControlPoint(x: number, y: number) {
		return this._controlPoints.get(x, y);
	}
	private uMX = Mat4.create();
	private uMY = Mat4.create();
	private uMR = Mat4.create();
	private uMG = Mat4.create();
	private uMB = Mat4.create();
	private tmpV2 = Vec2.create();
	/**
	 * 更新最终呈现的网格数据，此方法应在所有控制点或细分参数的操作完成后调用
	 */
	updateMesh() {
		const subDivM1 = this._subDivisions - 1;
		const tW = subDivM1 * (this._controlPoints.height - 1);
		const tH = subDivM1 * (this._controlPoints.width - 1);
		for (let x = 0; x < this._controlPoints.width - 1; x++) {
			for (let y = 0; y < this._controlPoints.height - 1; y++) {
				const p00 = this._controlPoints.get(x, y);
				const p01 = this._controlPoints.get(x, y + 1);
				const p10 = this._controlPoints.get(x + 1, y);
				const p11 = this._controlPoints.get(x + 1, y + 1);

				const X = meshCoefficients(p00, p01, p10, p11, "x", this.uMX);
				const Y = meshCoefficients(p00, p01, p10, p11, "y", this.uMY);

				const R = colorCoefficients(p00, p01, p10, p11, "r", this.uMR);
				const G = colorCoefficients(p00, p01, p10, p11, "g", this.uMG);
				const B = colorCoefficients(p00, p01, p10, p11, "b", this.uMB);

				const sX = x / (this._controlPoints.width - 1);
				const sY = y / (this._controlPoints.height - 1);
				for (let u = 0; u < this._subDivisions; u++) {
					for (let v = 0; v < this._subDivisions; v++) {
						// 不知道为啥 x 和 y 要反过来
						// 总之能跑就行（雾）
						const vx = y * this._subDivisions + u;
						const vy = x * this._subDivisions + v;
						const [px, py] = surfacePoint(
							u / subDivM1,
							v / subDivM1,
							X,
							Y,
							this.tmpV2,
						);
						this.setVertexPos(vx, vy, px, py);
						this.setVertexUV(vx, vy, sX + v / tH, 1 - sY - u / tW);
						const [pr, pg, pb] = colorPoint(
							u / subDivM1,
							v / subDivM1,
							R,
							G,
							B,
						);
						this.setVertexColor(vx, vy, pr, pg, pb);
					}
				}
			}
		}
		this.update();
	}
}

class GLTexture implements Disposable {
	readonly tex: WebGLTexture;

	constructor(
		private gl: WebGLRenderingContext,
		albumImageData: ImageData,
	) {
		const albumTexture = gl.createTexture();
		if (!albumTexture) throw new Error("Failed to create texture");
		this.tex = albumTexture;
		gl.activeTexture(gl.TEXTURE0);
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

	bind() {
		this.gl.bindTexture(this.gl.TEXTURE_2D, this.tex);
	}

	dispose(): void {
		this.gl.deleteTexture(this.tex);
	}
}

function createOffscreenCanvas(width: number, height: number) {
	if ("OffscreenCanvas" in window) return new OffscreenCanvas(width, height);
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	return canvas;
}

interface MeshState {
	mesh: BHPMesh;
	texture: GLTexture;
	alpha: number;
}

export class MeshGradientRenderer extends BaseRenderer {
	private gl: RenderingContext;
	private lastFrameTime = 0;
	private frameTime = 0;
	private lastTickTime = 0;
	private volume = 0;
	private tickHandle = 0;
	private maxFPS = 60;
	private paused = false;
	private staticMode = false;
	private mainProgram: GLProgram;
	private blendProgram: GLProgram;
	private blurProgram: GLProgram;

	private manualControl = false;
	private reduceImageSizeCanvas = createOffscreenCanvas(
		32,
		32,
	) as HTMLCanvasElement;
	private targetSize = Vec2.fromValues(0, 0);
	private currentSize = Vec2.fromValues(0, 0);
	private fullScreenMesh: Mesh;
	private drawFrameBuffer: WebGLFramebuffer;
	private drawFrameBufferTexture: WebGLTexture;
	private finalFrameBuffer: WebGLFramebuffer;
	private finalFrameBufferTexture: WebGLTexture;
	private meshStates: MeshState[] = [];
	private _disposed = false;
	setManualControl(enable: boolean) {
		this.manualControl = enable;
	}

	setWireFrame(enable: boolean) {
		for (const state of this.meshStates) {
			state.mesh.setWireFrame(enable);
		}
	}

	getControlPoint(x: number, y: number): ControlPoint | undefined {
		return this.meshStates[this.meshStates.length - 1]?.mesh?.getControlPoint(
			x,
			y,
		);
	}

	resizeControlPoints(width: number, height: number) {
		return this.meshStates[
			this.meshStates.length - 1
		]?.mesh?.resizeControlPoints(width, height);
	}

	resetSubdivition(subDivisions: number) {
		return this.meshStates[this.meshStates.length - 1]?.mesh?.resetSubdivition(
			subDivisions,
		);
	}

	private onTick(tickTime: number) {
		this.tickHandle = 0;
		if (this.paused) return;
		if (this._disposed) return;

		if (Number.isNaN(this.lastFrameTime)) {
			this.lastFrameTime = tickTime;
		}
		const delta = tickTime - this.lastTickTime;
		const frameDelta = tickTime - this.lastFrameTime;
		this.lastFrameTime = tickTime;
		if (delta < 1000 / this.maxFPS) {
			this.requestTick();
			return;
		}

		this.frameTime += frameDelta;

		if (!(this.onRedraw(this.frameTime, frameDelta) && this.staticMode)) {
			this.requestTick();
		} else if (this.staticMode) {
			this.lastFrameTime = Number.NaN;
		}

		this.lastTickTime = tickTime;
	}

	private checkIfResize() {
		let [tW, tH] = [
			this.targetSize.x / window.devicePixelRatio,
			this.targetSize.y / window.devicePixelRatio,
		];
		const [cW, cH] = [this.currentSize.x, this.currentSize.y];
		if (tW !== cW || tH !== cH) {
			tW /= 5;
			tH /= 5;
			super.onResize(tW, tH);
			const gl = this.gl;
			gl.bindTexture(gl.TEXTURE_2D, this.drawFrameBufferTexture);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				tW,
				tH,
				0,
				gl.RGBA,
				this.supportTextureFloat ? gl.FLOAT : gl.UNSIGNED_BYTE,
				null,
			);
			gl.bindTexture(gl.TEXTURE_2D, this.finalFrameBufferTexture);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				tW,
				tH,
				0,
				gl.RGBA,
				this.supportTextureFloat ? gl.FLOAT : gl.UNSIGNED_BYTE,
				null,
			);
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.drawFrameBuffer);
			gl.viewport(0, 0, tW, tH);
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFrameBuffer);
			gl.viewport(0, 0, tW, tH);
			gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			gl.viewport(0, 0, tW, tH);
			this.currentSize.x = tW;
			this.currentSize.y = tH;
		}
	}

	private onRedraw(tickTime: number, delta: number) {
		const latestMeshState = this.meshStates[this.meshStates.length - 1];
		let canBeStatic = false;
		if (latestMeshState) {
			latestMeshState.mesh.bind();
			// 考虑到我们并不逐帧更新网格控制点，因此也不需要重复调用 updateMesh
			if (this.manualControl) latestMeshState.mesh.updateMesh();
			latestMeshState.alpha = Math.min(1, latestMeshState.alpha + delta / 500);
			if (latestMeshState.alpha >= 1) {
				const deleted = this.meshStates.splice(0, this.meshStates.length - 1);
				for (const state of deleted) {
					state.mesh.dispose();
					state.texture.dispose();
				}
			}
			if (this.meshStates.length === 1 && latestMeshState.alpha >= 1) {
				canBeStatic = true;
			}
		}

		const gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.clear(gl.COLOR_BUFFER_BIT);

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFrameBuffer);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.clear(gl.COLOR_BUFFER_BIT);

		this.checkIfResize();

		this.mainProgram.use();
		gl.activeTexture(gl.TEXTURE0);
		this.mainProgram.setUniform1f("u_time", tickTime / 10000);
		this.mainProgram.setUniform1f(
			"u_aspect",
			this.manualControl ? 1 : this.canvas.width / this.canvas.height,
		);
		this.mainProgram.setUniform1i("u_texture", 0);

		this.mainProgram.setUniform1f("u_volume", this.volume);
		for (const state of this.meshStates) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, this.drawFrameBuffer);
			gl.clear(gl.COLOR_BUFFER_BIT);
			this.mainProgram.use();
			state.texture.bind();
			state.mesh.bind();
			state.mesh.draw();

			gl.bindFramebuffer(gl.FRAMEBUFFER, this.finalFrameBuffer);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, this.drawFrameBufferTexture);
			this.blendProgram.use();
			this.blendProgram.setUniform1f("u_alpha", state.alpha);
			this.blendProgram.setUniform1i("u_texture", 0);
			this.fullScreenMesh.bind();
			this.fullScreenMesh.draw();
		}

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.finalFrameBufferTexture);
		this.blurProgram.use();
		this.blurProgram.setUniform1i("u_texture", 0);
		this.blurProgram.setUniform2f(
			"u_texture_res",
			this.currentSize.x,
			this.currentSize.y,
		);
		this.fullScreenMesh.bind();
		this.fullScreenMesh.draw();

		gl.flush();

		return canBeStatic;
	}

	private onTickBinded = this.onTick.bind(this);

	private requestTick() {
		if (this._disposed) return;
		if (this.tickHandle === 0)
			this.tickHandle = requestAnimationFrame(this.onTickBinded);
	}

	private supportTextureFloat = true;

	constructor(canvas: HTMLCanvasElement) {
		super(canvas);

		const gl = canvas.getContext("webgl");
		if (!gl) throw new Error("WebGL not supported");
		if (!gl.getExtension("EXT_color_buffer_float"))
			console.warn("EXT_color_buffer_float not supported");
		if (!gl.getExtension("EXT_float_blend")) {
			console.warn("EXT_float_blend not supported");
			this.supportTextureFloat = false;
		}
		if (!gl.getExtension("OES_texture_float_linear"))
			console.warn("OES_texture_float_linear not supported");
		if (!gl.getExtension("OES_texture_float")) {
			this.supportTextureFloat = false;
			console.warn("OES_texture_float not supported");
		}

		this.gl = gl;
		gl.enable(gl.BLEND);
		gl.enable(gl.DEPTH_TEST);
		gl.depthFunc(gl.ALWAYS);

		this.mainProgram = new GLProgram(
			gl,
			meshVertShader,
			meshFragShader,
			"main-program-mg",
		);

		this.blendProgram = new GLProgram(
			gl,
			blendVertShader,
			blendFragShader,
			"blend-program-mg",
		);

		this.blurProgram = new GLProgram(
			gl,
			blurVertShader,
			blurFragShader,
			"blur-program-mg",
		);

		this.fullScreenMesh = new Mesh(
			gl,
			this.blendProgram.attrs.a_pos,
			this.blendProgram.attrs.a_color,
			this.blendProgram.attrs.a_uv,
		);
		this.fullScreenMesh.update();

		const drawFrameBufferTexture = gl.createTexture();
		if (!drawFrameBufferTexture)
			throw new Error("Failed to create drawFrameBufferTexture texture");
		this.drawFrameBufferTexture = drawFrameBufferTexture;
		gl.bindTexture(gl.TEXTURE_2D, drawFrameBufferTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			canvas.width,
			canvas.height,
			0,
			gl.RGBA,
			this.supportTextureFloat ? gl.FLOAT : gl.UNSIGNED_BYTE,
			null,
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		const drawFrameBuffer = gl.createFramebuffer();
		if (!drawFrameBuffer) throw new Error("Failed to create drawFrameBuffer");
		this.drawFrameBuffer = drawFrameBuffer;
		gl.bindFramebuffer(gl.FRAMEBUFFER, drawFrameBuffer);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			drawFrameBufferTexture,
			0,
		);

		const finalFrameBufferTexture = gl.createTexture();
		if (!finalFrameBufferTexture)
			throw new Error("Failed to create finalFrameBufferTexture texture");
		this.finalFrameBufferTexture = finalFrameBufferTexture;
		gl.bindTexture(gl.TEXTURE_2D, finalFrameBufferTexture);
		gl.texImage2D(
			gl.TEXTURE_2D,
			0,
			gl.RGBA,
			canvas.width,
			canvas.height,
			0,
			gl.RGBA,
			this.supportTextureFloat ? gl.FLOAT : gl.UNSIGNED_BYTE,
			null,
		);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		const finalFrameBuffer = gl.createFramebuffer();
		if (!finalFrameBuffer) throw new Error("Failed to create finalFrameBuffer");
		this.finalFrameBuffer = finalFrameBuffer;
		gl.bindFramebuffer(gl.FRAMEBUFFER, finalFrameBuffer);
		gl.framebufferTexture2D(
			gl.FRAMEBUFFER,
			gl.COLOR_ATTACHMENT0,
			gl.TEXTURE_2D,
			finalFrameBufferTexture,
			0,
		);

		this.requestTick();
	}

	protected override onResize(width: number, height: number): void {
		this.targetSize.x = Math.ceil(width);
		this.targetSize.y = Math.ceil(height);
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
		isVideo?: boolean,
	): Promise<void> {
		if (typeof albumSource === "string" && albumSource.trim().length === 0)
			throw new Error("Empty album url");
		let res: HTMLImageElement | HTMLVideoElement | null = null;
		let remainRetryTimes = 5;
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
		if (!res) return;
		// resize image
		const c = this.reduceImageSizeCanvas;
		const ctx = c.getContext("2d", {
			willReadFrequently: true,
		});
		if (!ctx) throw new Error("Failed to create canvas context");
		ctx.clearRect(0, 0, c.width, c.height);
		// Safari 不支持 filter
		// ctx.filter = baseFilter;
		const imgw =
			res instanceof HTMLVideoElement ? res.videoWidth : res.naturalWidth;
		const imgh =
			res instanceof HTMLVideoElement ? res.videoHeight : res.naturalHeight;
		if (imgw * imgh === 0) throw new Error("Invalid image size");
		ctx.drawImage(res, 0, 0, imgw, imgh, 0, 0, c.width, c.height);

		const imageData = ctx.getImageData(0, 0, c.width, c.height);
		contrastImage(imageData, 0.4);
		saturateImage(imageData, 3.0);
		contrastImage(imageData, 1.7);
		brightnessImage(imageData, 0.75);
		blurImage(imageData, 2, 4);

		if (this.manualControl && this.meshStates.length > 0) {
			this.meshStates[0].texture.dispose();
			this.meshStates[0].texture = new GLTexture(this.gl, imageData);
		} else {
			const newMesh = new BHPMesh(
				this.gl,
				this.mainProgram.attrs.a_pos,
				this.mainProgram.attrs.a_color,
				this.mainProgram.attrs.a_uv,
			);
			newMesh.resetSubdivition(15);

			const chosenPreset =
				CONTROL_POINT_PRESETS[
					Math.floor(Math.random() * CONTROL_POINT_PRESETS.length)
				];
			newMesh.resizeControlPoints(chosenPreset.width, chosenPreset.height);
			const uPower = 2 / (chosenPreset.width - 1);
			const vPower = 2 / (chosenPreset.height - 1);
			for (const cp of chosenPreset.conf) {
				const p = newMesh.getControlPoint(cp.cx, cp.cy);
				p.location.x = cp.x;
				p.location.y = cp.y;
				p.uRot = (cp.ur * Math.PI) / 180;
				p.vRot = (cp.vr * Math.PI) / 180;
				p.uScale = uPower * cp.up;
				p.vScale = vPower * cp.vp;
			}

			newMesh.updateMesh();

			const albumTexture = new GLTexture(this.gl, imageData);
			const newState: MeshState = {
				mesh: newMesh,
				texture: albumTexture,
				alpha: 0,
			};
			this.meshStates.push(newState);
		}

		this.requestTick();
	}
	override setLowFreqVolume(volume: number): void {
		this.volume = volume / 10;
	}
	override setHasLyric(_hasLyric: boolean): void {
		// 不再考虑实现
	}

	override dispose(): void {
		super.dispose();
		if (this.tickHandle) {
			cancelAnimationFrame(this.tickHandle);
			this.tickHandle = 0;
		}
		this._disposed = true;
		this.mainProgram.dispose();
		this.blendProgram.dispose();
		this.fullScreenMesh.dispose();
		this.gl.deleteFramebuffer(this.drawFrameBuffer);
		this.gl.deleteTexture(this.drawFrameBufferTexture);
		for (const state of this.meshStates) {
			state.mesh.dispose();
			state.texture.dispose();
		}
	}
}

/**
 * @fileoverview
 * 基于 Mesh Gradient 渐变渲染的渲染器
 * 此渲染应该是 Apple Music 使用的背景渲染方式了
 * 参考内容 https://movingparts.io/gradient-meshes
 */

import { Disposable } from "../interfaces";
import { BaseRenderer } from "./base";
import { Mat4, Vec2, Vec3, Vec4 } from "gl-matrix";
import vertShader from "./shaders/base-color.vert.glsl?raw";
import fragShader from "./shaders/base-color.frag.glsl?raw";

type RenderingContext = WebGLRenderingContext;

class GLProgram implements Disposable {
    private gl: RenderingContext;
    program: WebGLProgram;
    private vertexShader: WebGLShader;
    private fragmentShader: WebGLShader;
    readonly attrPos: number;
    readonly attrColor: number;
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

        const attrPos = gl.getAttribLocation(this.program, "a_pos");
        if (attrPos === -1)
            throw new Error(
                `Failed to get attribute location a_pos for "${this.label}"`,
            );
        this.attrPos = attrPos;

        const attrColor = gl.getAttribLocation(this.program, "a_color");
        if (attrColor === -1)
            throw new Error(
                `Failed to get attribute location a_color for "${this.label}"`,
            );
        this.attrColor = attrColor;
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

// 调试用途，开启线框模式
const ENABLE_WIRE_FRAME = false;

class Mesh implements Disposable {
    protected vertexWidth = 0;
    protected vertexHeight = 0;
    private vertexBuffer: WebGLBuffer;
    private indexBuffer: WebGLBuffer;
    private vertexData: Float32Array;
    private indexData: Uint16Array;
    private vertexIndexLength = 0;
    constructor(
        private readonly gl: RenderingContext,
        private readonly attrPos: number,
        private readonly attrColor: number
    ) {
        const vertexBuf = gl.createBuffer();
        if (!vertexBuf) throw new Error("Failed to create vertex buffer");
        this.vertexBuffer = vertexBuf;
        const indexBuf = gl.createBuffer();
        if (!indexBuf) throw new Error("Failed to create index buffer");
        this.indexBuffer = indexBuf;

        gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(this.attrPos, 2, gl.FLOAT, false, 4 * 5, 0);
        gl.enableVertexAttribArray(this.attrPos);
        gl.vertexAttribPointer(this.attrColor, 3, gl.FLOAT, false, 4 * 5, 4 * 2);
        gl.enableVertexAttribArray(this.attrColor);

        this.vertexData = new Float32Array(0);
        this.indexData = new Uint16Array(0);

        this.resize(2, 2);
    }

    setVertexPos(vx: number, vy: number, x: number, y: number): void {
        const idx = (vx + vy * this.vertexWidth) * 5;
        if (idx >= this.vertexData.length - 1) {
            console.warn("Vertex position out of range", idx, this.vertexData.length);
            return;
        }
        this.vertexData[idx] = x;
        this.vertexData[idx + 1] = y;
    }

    setVertexColor(vx: number, vy: number, r: number, g: number, b: number): void {
        const idx = (vx + vy * this.vertexWidth) * 5 + 2;
        if (idx >= this.vertexData.length - 1) {
            console.warn("Vertex position out of range", idx, this.vertexData.length);
            return;
        }
        this.vertexData[idx] = r;
        this.vertexData[idx + 1] = g;
        this.vertexData[idx + 2] = b;
    }

    getVertexIndexLength(): number {
        return this.vertexIndexLength;
    }

    resize(vertexWidth: number, vertexHeight: number): void {
        this.vertexWidth = vertexWidth;
        this.vertexHeight = vertexHeight;
        // 2 个顶点坐标 + 3 个颜色值
        this.vertexIndexLength = (vertexWidth * vertexHeight) * 6;
        if (ENABLE_WIRE_FRAME) {
            this.vertexIndexLength = (vertexWidth * vertexHeight) * 10;
        }
        const vertexData = new Float32Array((vertexWidth * vertexHeight) * (2 + 3));
        const indexData = new Uint16Array(this.vertexIndexLength);
        this.vertexData = vertexData;
        this.indexData = indexData;
        for (let y = 0; y < vertexHeight; y++) {
            for (let x = 0; x < vertexWidth; x++) {
                const px = x / (vertexWidth - 1) * 2 - 1;
                const py = y / (vertexHeight - 1) * 2 - 1;
                this.setVertexPos(x, y, px || 0, py || 0);
                this.setVertexColor(x, y, 1, 1, 1);
            }
        }
        for (let y = 0; y < vertexHeight - 1; y++) {
            for (let x = 0; x < vertexWidth - 1; x++) {
                if (ENABLE_WIRE_FRAME) {
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
        gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indexData, this.gl.STATIC_DRAW);
    }

    bind() {
        const gl = this.gl;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    }

    update() {
        const gl = this.gl;
        gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(this.gl.ARRAY_BUFFER, this.vertexData, this.gl.DYNAMIC_DRAW);
    }

    dispose(): void {
        this.gl.deleteBuffer(this.vertexBuffer);
        this.gl.deleteBuffer(this.indexBuffer);
    }
}

class ControlPoint {
    color = Vec3.fromValues(0, 0, 0);
    location = Vec2.fromValues(0, 0);
    uTangent = Vec2.fromValues(0, 0);
    vTangent = Vec2.fromValues(0, 0);
}

const H = Mat4.fromValues(
    2, -2, 1, 1,
    -3, 3, -2, -1,
    0, 0, 1, 0,
    1, 0, 0, 0,
);
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
) {
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

    return Vec2.fromValues(
        x, y
    );
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
function colorPoint(
    u: number,
    v: number,
    R: Mat4,
    G: Mat4,
    B: Mat4,
): Vec3 {
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
    ) {
        super(gl, attrPos, attrColor);
        this.resizeControlPoints(3, 3);
    }
    /**
     * 以当前的控制点矩阵大小和细分级别为参考重新设置细分级别，此操作不会重设控制点数据
     * @param subDivisions 细分级别
     */
    resetSubdivition(subDivisions: number) {
        this._subDivisions = subDivisions;
        super.resize(
            (this._controlPoints.width - 1) * subDivisions,
            (this._controlPoints.height - 1) * subDivisions
        );
    }
    /**
     * 重设控制点矩阵尺寸，将会重置所有控制点的颜色数据
     * 请在调用此方法后重新设置颜色，并调用 updateMesh 方法更新网格
     * @param width 控制点宽度数量，必须大于等于 2
     * @param height 控制点高度数量，必须大于等于 3
     */
    resizeControlPoints(width: number, height: number) {
        if (!(width >= 2 && height >= 2)) {
            throw new Error("Control points must be larger than 3x3 or equal");
        }
        this._controlPoints.resize(width, height);
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const point = new ControlPoint();
                point.location.x = x / (width - 1) * 2 - 1;
                point.location.y = y / (height - 1) * 2 - 1;
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
    /**
     * 更新最终呈现的网格数据，此方法应在所有控制点或细分参数的操作完成后调用
     */
    updateMesh() {
        const subDivM1 = this._subDivisions - 1;
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

                for (let u = 0; u < this._subDivisions; u++) {
                    for (let v = 0; v < this._subDivisions; v++) {
                        // 不知道为啥 x 和 y 要反过来
                        // 总之能跑就行（雾）
                        const vx = y * this._subDivisions + u;
                        const vy = x * this._subDivisions + v;
                        const [px, py] = surfacePoint(u / subDivM1, v / subDivM1, X, Y);
                        this.setVertexPos(vx, vy, px, py);
                        const [pr, pg, pb] = colorPoint(u / subDivM1, v / subDivM1, R, G, B);
                        this.setVertexColor(vx, vy, pr, pg, pb);
                    }
                }
            }
        }
        this.update();
    }
}

export class MeshGradientRenderer extends BaseRenderer {
    private gl: RenderingContext;
    private lastFrameTime = 0;
    private frameTime = 0;
    private lastTickTime = 0;
    private playTime = 0;
    private tickHandle = 0;
    private maxFPS = 30;
    private paused = false;
    private staticMode = false;
    private mainMesh: BHPMesh;
    private mainProgram: GLProgram;

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

        this.frameTime += frameDelta;

        if (!(this.onRedraw(this.playTime, frameDelta) && this.staticMode)) {
            this.requestTick();
        }

        this.lastTickTime = tickTime;
    }

    private onRedraw(tickTime: number, delta: number) {
        this.mainMesh.getControlPoint(1, 2).location = Vec2.fromValues(-0.25 + Math.sin(this.frameTime / 1000) * 0.25, -0.25 + Math.cos(this.frameTime / 1000) * 0.25);
        this.mainMesh.getControlPoint(2, 1).location = Vec2.fromValues(0.25 + Math.cos(this.frameTime / 1000) * 0.25, -0.25 + Math.sin(this.frameTime / 1000) * 0.25);
        this.mainMesh.updateMesh();

        const gl = this.gl;
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearColor(0, 0, 0, 1);

        this.mainMesh.bind();
        this.mainProgram.use();
        if (ENABLE_WIRE_FRAME) {
            gl.drawElements(gl.LINES, this.mainMesh.getVertexIndexLength(), gl.UNSIGNED_SHORT, 0);
        } else {
            gl.drawElements(gl.TRIANGLES, this.mainMesh.getVertexIndexLength(), gl.UNSIGNED_SHORT, 0);
        }
        // gl.flush();

        return false;
    }

    private requestTick() {
        if (!this.tickHandle)
            this.tickHandle = requestAnimationFrame((t) => this.onTick(t));
    }

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);

        const gl = canvas.getContext("webgl");
        if (!gl) throw new Error("WebGL not supported");
        this.gl = gl;
        gl.enable(gl.BLEND);

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        this.mainProgram = new GLProgram(gl, vertShader, fragShader, "main-program-mg");
        this.mainMesh = new BHPMesh(gl, this.mainProgram.attrPos, this.mainProgram.attrColor);
        this.mainMesh.resizeControlPoints(4, 4);
        this.mainMesh.resetSubdivition(15);
        this.mainMesh.updateMesh();

        this.requestTick();
    }

    protected override onResize(width: number, height: number): void {
        super.onResize(width, height);
        const gl = this.gl;
        gl.viewport(0, 0, width, height);
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
    override async setAlbum(albumSource: string | HTMLImageElement | HTMLVideoElement, isVideo?: boolean): Promise<void> {

    }
    override setLowFreqVolume(volume: number): void {
        // TODO: 待实现
    }
    override setHasLyric(hasLyric: boolean): void {
        // TODO: 待实现
    }
}

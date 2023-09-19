import * as twgl from "twgl.js";
import Vibrant from "node-vibrant";
import { Disposable } from "../interfaces";

export class TwglRenderer implements Disposable {
	private observer: ResizeObserver;
	private staticMode = false;
	private flowSpeed = 2;
	private currerntRenderScale = 0.75;
	private ctx: WebGLRenderingContext;
	private mainFB: twgl.FramebufferInfo;

	constructor(private canvas: HTMLCanvasElement) {
		const bounds = canvas.getBoundingClientRect();
		this.canvas.width = bounds.width * this.currerntRenderScale;
		this.canvas.height = bounds.height * this.currerntRenderScale;
		this.observer = new ResizeObserver(() => {
			const bounds = canvas.getBoundingClientRect();
			this.canvas.width = Math.max(1, bounds.width);
			this.canvas.height = Math.max(1, bounds.height);
		});
		this.observer.observe(canvas);
		const gl = twgl.createContext(canvas);
		const fb = twgl.createFramebufferInfo(gl);

		this.ctx = gl;
		this.mainFB = fb;
	}

	private resize() {
		const gl = this.ctx;
		const fb = this.mainFB;
		twgl.resizeFramebufferInfo(gl, fb);
	}

	dispose() {
		this.observer.disconnect();
		this.canvas.remove();
	}
}

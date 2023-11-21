import { Container } from "@pixi/display";
import { Application } from "@pixi/app";
import { BlurFilter } from "@pixi/filter-blur";
import { ColorMatrixFilter } from "@pixi/filter-color-matrix";
import { Texture } from "@pixi/core";
import { Sprite } from "@pixi/sprite";
import { BulgePinchFilter } from "@pixi/filter-bulge-pinch";
import { Disposable } from "../interfaces";

class TimedContainer extends Container {
	public time = 0;
}

export class PixiRenderer implements Disposable {
	private observer: ResizeObserver;
	private app: Application;
	private curContainer?: TimedContainer;
	private staticMode = false;
	private lastContainer: Set<TimedContainer> = new Set();
	private onTick = (delta: number): void => {
		for (const lastContainer of this.lastContainer) {
			lastContainer.alpha = Math.max(0, lastContainer.alpha - delta / 60);
			if (lastContainer.alpha <= 0) {
				this.app.stage.removeChild(lastContainer);
				this.lastContainer.delete(lastContainer);
				lastContainer.destroy(true);
			}
		}

		if (this.curContainer) {
			this.curContainer.alpha = Math.min(
				1,
				this.curContainer.alpha + delta / 60,
			);
			const [s1, s2, s3, s4] = this.curContainer.children as Sprite[];
			const maxSize = Math.max(this.app.screen.width, this.app.screen.height);
			s1.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
			s2.position.set(
				this.app.screen.width / 2.5,
				this.app.screen.height / 2.5,
			);
			s3.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
			s4.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
			s1.width = maxSize * Math.sqrt(2);
			s1.height = s1.width;
			s2.width = maxSize * 0.8;
			s2.height = s2.width;
			s3.width = maxSize * 0.5;
			s3.height = s3.width;
			s4.width = maxSize * 0.25;
			s4.height = s4.width;

			this.curContainer.time += delta * this.flowSpeed;

			s1.rotation += (delta / 1000) * this.flowSpeed;
			s2.rotation -= (delta / 500) * this.flowSpeed;
			s3.rotation += (delta / 1000) * this.flowSpeed;
			s4.rotation -= (delta / 750) * this.flowSpeed;

			s3.x =
				this.app.screen.width / 2 +
				(this.app.screen.width / 4) *
					Math.cos((this.curContainer.time / 1000) * 0.75);
			s3.y =
				this.app.screen.height / 2 +
				(this.app.screen.width / 4) *
					Math.cos((this.curContainer.time / 1000) * 0.75);

			s4.x =
				this.app.screen.width / 2 +
				(this.app.screen.width / 4) * 0.1 +
				Math.cos(this.curContainer.time * 0.006 * 0.75);
			s4.y =
				this.app.screen.height / 2 +
				(this.app.screen.width / 4) * 0.1 +
				Math.cos(this.curContainer.time * 0.006 * 0.75);

			if (
				this.curContainer.alpha >= 1 &&
				this.lastContainer.size === 0 &&
				this.staticMode
			) {
				this.app.ticker.stop();
			}
		}
	};
	private flowSpeed = 2;
	private currerntRenderScale = 0.75;
	constructor(private canvas: HTMLCanvasElement) {
		const bounds = canvas.getBoundingClientRect();
		this.canvas.width = bounds.width * this.currerntRenderScale;
		this.canvas.height = bounds.height * this.currerntRenderScale;
		this.observer = new ResizeObserver(() => {
			const bounds = canvas.getBoundingClientRect();
			this.canvas.width = Math.max(1, bounds.width);
			this.canvas.height = Math.max(1, bounds.height);
			this.app.renderer.resize(
				this.canvas.width * this.currerntRenderScale,
				this.canvas.height * this.currerntRenderScale,
			);
			this.app.ticker.start();
			this.rebuildFilters();
		});
		this.observer.observe(canvas);
		this.app = new Application({
			view: canvas,
			resizeTo: this.canvas,
			powerPreference: "low-power",
			backgroundAlpha: 0,
		});
		this.rebuildFilters();
		this.app.ticker.maxFPS = 30;
		this.app.ticker.add(this.onTick);
		this.app.ticker.start();
	}
	/**
	 * 修改背景的流动速度，数字越大越快，默认为 2
	 * @param speed 背景的流动速度，默认为 2
	 */
	setFlowSpeed(speed: number) {
		this.flowSpeed = speed;
	}
	/**
	 * 修改背景的渲染比例，默认是 0.5
	 *
	 * 一般情况下这个程度既没有明显瑕疵也不会特别吃性能
	 * @param scale 背景的渲染比例
	 */
	setRenderScale(scale: number) {
		this.currerntRenderScale = scale;
		const bounds = this.canvas.getBoundingClientRect();
		this.canvas.width = Math.max(1, bounds.width);
		this.canvas.height = Math.max(1, bounds.height);
		this.app.renderer.resize(
			this.canvas.width * this.currerntRenderScale,
			this.canvas.height * this.currerntRenderScale,
		);
		this.rebuildFilters();
	}
	private rebuildFilters() {
		const minBorder = Math.min(this.canvas.width, this.canvas.height);
		const maxBorder = Math.max(this.canvas.width, this.canvas.height);
		const c0 = new ColorMatrixFilter();
		c0.saturate(1.2, false);
		const c1 = new ColorMatrixFilter();
		c1.brightness(0.6, false);
		const c2 = new ColorMatrixFilter();
		c2.contrast(0.3, true);
		this.app.stage.filters?.forEach((filter) => {
			filter.destroy();
		});
		this.app.stage.filters = [];
		this.app.stage.filters.push(new BlurFilter(5, 1));
		this.app.stage.filters.push(new BlurFilter(10, 1));
		this.app.stage.filters.push(new BlurFilter(20, 2));
		this.app.stage.filters.push(new BlurFilter(40, 2));
		this.app.stage.filters.push(new BlurFilter(80, 2));
		if (minBorder > 768) this.app.stage.filters.push(new BlurFilter(160, 4));
		if (minBorder > 768 * 2)
			this.app.stage.filters.push(new BlurFilter(320, 4));

		this.app.stage.filters.push(c0, c1, c2);
		this.app.stage.filters.push(new BlurFilter(5, 1));
		if (Math.random() > 0.5) {
			this.app.stage.filters.push(
				new BulgePinchFilter({
					radius: (maxBorder + minBorder) / 2,
					strength: 1,
					center: [0.25, 1],
				}),
			);
			this.app.stage.filters.push(
				new BulgePinchFilter({
					radius: (maxBorder + minBorder) / 2,
					strength: 1,
					center: [0.75, 0],
				}),
			);
		} else {
			this.app.stage.filters.push(
				new BulgePinchFilter({
					radius: (maxBorder + minBorder) / 2,
					strength: 1,
					center: [0.75, 1],
				}),
			);
			this.app.stage.filters.push(
				new BulgePinchFilter({
					radius: (maxBorder + minBorder) / 2,
					strength: 1,
					center: [0.25, 0],
				}),
			);
		}
	}
	/**
	 * 是否启用静态模式，即图片在更换后就会保持静止状态并禁用更新，以节省性能
	 * @param enable 是否启用静态模式
	 */
	setStaticMode(enable = false) {
		this.staticMode = enable;
		this.app.ticker.start();
	}
	/**
	 * 修改背景动画帧率，默认是 30 FPS
	 *
	 * 如果设置成 0 则会停止动画
	 * @param fps 目标帧率，默认 30 FPS
	 */
	setFPS(fps: number) {
		this.app.ticker.maxFPS = fps;
	}
	/**
	 * 暂停背景动画，画面即便是更新了图片也不会发生变化
	 */
	pause() {
		this.app.ticker.stop();
		this.app.render();
	}
	/**
	 * 恢复播放背景动画
	 */
	resume() {
		this.app.ticker.start();
	}
	/**
	 * 设置背景专辑图片，图片材质加载并设置完成后会返回
	 * @param albumUrl 图片的目标链接
	 */
	async setAlbumImage(albumUrl: string) {
		const img = new Image();
		img.src = albumUrl;
		img.crossOrigin = "anonymous";
		let remainRetryTimes = 5;
		let tex;
		while (!tex?.baseTexture?.resource?.valid && remainRetryTimes > 0) {
			try {
				await img.decode();
				tex = Texture.from(img, {
					resourceOptions: {
						autoLoad: false,
					},
				});
				await tex.baseTexture.resource.load();
			} catch (error) {
				console.warn(
					`failed on loading album image, retrying (${remainRetryTimes})`,
					albumUrl,
					error,
				);
				tex = undefined;
				remainRetryTimes--;
			}
		}
		if (!tex) return;
		const container = new TimedContainer();
		const s1 = new Sprite(tex);
		const s2 = new Sprite(tex);
		const s3 = new Sprite(tex);
		const s4 = new Sprite(tex);
		s1.anchor.set(0.5, 0.5);
		s2.anchor.set(0.5, 0.5);
		s3.anchor.set(0.5, 0.5);
		s4.anchor.set(0.5, 0.5);
		s1.rotation = Math.random() * Math.PI * 2;
		s2.rotation = Math.random() * Math.PI * 2;
		s3.rotation = Math.random() * Math.PI * 2;
		s4.rotation = Math.random() * Math.PI * 2;
		container.addChild(s1, s2, s3, s4);
		if (this.curContainer) this.lastContainer.add(this.curContainer);
		this.curContainer = container;
		this.app.stage.addChild(this.curContainer);
		this.curContainer.alpha = 0;
		this.app.ticker.start();
	}

	dispose() {
		this.observer.disconnect();
		this.app.ticker.remove(this.onTick);
		this.app.destroy(true);
	}
}

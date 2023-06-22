import {
	Application,
	BlurFilter,
	ColorMatrixFilter,
	Container,
	Filter,
	Sprite,
	Texture,
} from "pixi.js";
import colorDitheringFragment from "./color-dithering.frag"

class TimedContainer extends Container {
	public time: number = 0;
}

class ColorDitheringFilter extends Filter {
	constructor() {
		super(undefined, colorDitheringFragment)
	}
}

export class PixiRenderer {
	private observer: ResizeObserver;
	private app: Application;
	private curContainer?: TimedContainer;
	private lastContainer: Set<TimedContainer> = new Set();
	private onTick = (delta: number): void => {
		for (const lastContainer of this.lastContainer) {
			lastContainer.alpha = Math.max(0, lastContainer.alpha - delta / 60);
			if (lastContainer.alpha <= 0) {
				this.app.stage.removeChild(lastContainer);
				this.lastContainer.delete(lastContainer);
			}
		}

		if (this.curContainer) {
			this.curContainer.alpha = Math.min(
				1,
				this.curContainer.alpha + delta / 60,
			);
			const [s1, s2, s3, s4] = this.curContainer.children as Sprite[];
			s1.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
			s2.position.set(
				this.app.screen.width / 2.5,
				this.app.screen.height / 2.5,
			);
			s3.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
			s4.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
			s1.width = this.app.screen.width * 1.25;
			s1.height = s1.width;
			s2.width = this.app.screen.width * 0.8;
			s2.height = s2.width;
			s3.width = this.app.screen.width * 0.5;
			s3.height = s3.width;
			s4.width = this.app.screen.width * 0.25;
			s4.height = s4.width;

			this.curContainer.time += delta;

			s1.rotation += delta / 1000;
			s2.rotation -= delta / 500;
			s3.rotation += delta / 1000;
			s4.rotation -= delta / 750;

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
		}
	};
	constructor(private canvas: HTMLCanvasElement) {
		const bounds = canvas.getBoundingClientRect();
		this.canvas.width = bounds.width * window.devicePixelRatio;
		this.canvas.height = bounds.height * window.devicePixelRatio;
		this.observer = new ResizeObserver(() => {
			const bounds = canvas.getBoundingClientRect();
			this.canvas.width = bounds.width * window.devicePixelRatio;
			this.canvas.height = bounds.height * window.devicePixelRatio;
			this.app.renderer.resize(this.canvas.width, this.canvas.height);
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
		this.app.ticker.add(this.onTick);
		this.app.ticker.start();
	}

	rebuildFilters() {
		const minBorder = Math.min(this.canvas.width, this.canvas.height);
		const c0 = new ColorMatrixFilter();
		c0.saturate(1.2, false);
		const c1 = new ColorMatrixFilter();
		c1.brightness(0.6, false);
		const c2 = new ColorMatrixFilter();
		c2.contrast(1.3, false);
		this.app.stage.filters = [];
		this.app.stage.filters.push(new BlurFilter(5, 1));
		this.app.stage.filters.push(new BlurFilter(10, 1));
		this.app.stage.filters.push(new BlurFilter(20, 2));
		this.app.stage.filters.push(new BlurFilter(40, 2));
		this.app.stage.filters.push(new BlurFilter(80, 2));
		if (minBorder > 768) {
			this.app.stage.filters.push(new BlurFilter(160, 4));
		}
		if (minBorder > 768 * 2) {
			this.app.stage.filters.push(new BlurFilter(320, 4));
		}
		this.app.stage.filters.push(c0, c1, c2);
		this.app.stage.filters.push(new BlurFilter(5, 1));
		this.app.stage.filters.push(new ColorDitheringFilter());
	}

	async updateAlbum(albumUrl: string) {
		const tex = await Texture.fromURL(albumUrl);
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
	}

	dispose() {
		this.observer.disconnect();
		this.app.ticker.remove(this.onTick);
	}
}

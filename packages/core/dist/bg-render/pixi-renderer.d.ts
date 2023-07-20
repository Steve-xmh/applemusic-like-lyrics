import { Disposable } from "../interfaces";
export declare class PixiRenderer implements Disposable {
    private canvas;
    private observer;
    private app;
    private curContainer?;
    private lastContainer;
    private onTick;
    flowSpeed: number;
    private currerntRenderScale;
    constructor(canvas: HTMLCanvasElement);
    setRenderScale(scale: number): void;
    rebuildFilters(): void;
    setFPS(fps: number): void;
    pause(): void;
    resume(): void;
    setAlbumImage(albumUrl: string): Promise<void>;
    dispose(): void;
}

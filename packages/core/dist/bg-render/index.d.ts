/**
 * @fileoverview
 * 一个播放歌词的组件
 * @author SteveXMH
 */
export { AbstractBaseRenderer, BaseRenderer } from "./base";
import { AbstractBaseRenderer, BaseRenderer } from "./base";
export { PixiRenderer } from "./pixi-renderer";
export { EplorRenderer } from "./eplor-renderer";
export declare class BackgroundRender<Renderer extends BaseRenderer> implements AbstractBaseRenderer {
    private element;
    private renderer;
    constructor(renderer: Renderer, canvas: HTMLCanvasElement);
    static new<Renderer extends BaseRenderer>(type: {
        new (canvas: HTMLCanvasElement): Renderer;
    }): BackgroundRender<Renderer>;
    setRenderScale(scale: number): void;
    setFlowSpeed(speed: number): void;
    setStaticMode(enable: boolean): void;
    setFPS(fps: number): void;
    pause(): void;
    resume(): void;
    setAlbumImage(albumUrl: string): Promise<void>;
    getElement(): HTMLCanvasElement;
    dispose(): void;
}

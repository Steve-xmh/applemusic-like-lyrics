/**
 * @fileoverview
 * 一个播放歌词的组件
 * @author SteveXMH
 */
import type { HasElement, Disposable } from "../interfaces";
import { PixiRenderer } from "./pixi-renderer";
export declare class BackgroundRender extends PixiRenderer implements HasElement, Disposable {
    private element;
    constructor();
    getElement(): HTMLCanvasElement;
    dispose(): void;
}

import { Disposable } from "../interfaces";
export declare class TwglRenderer implements Disposable {
    private canvas;
    private observer;
    private staticMode;
    private flowSpeed;
    private currerntRenderScale;
    private ctx;
    private mainFB;
    constructor(canvas: HTMLCanvasElement);
    private resize;
    dispose(): void;
}

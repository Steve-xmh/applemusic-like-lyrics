import { Disposable } from "../interfaces";
export declare class PixiRenderer implements Disposable {
    private canvas;
    private observer;
    private app;
    private curContainer?;
    private staticMode;
    private lastContainer;
    private onTick;
    private flowSpeed;
    private currerntRenderScale;
    constructor(canvas: HTMLCanvasElement);
    /**
     * 修改背景的流动速度，数字越大越快，默认为 2
     * @param speed 背景的流动速度，默认为 2
     */
    setFlowSpeed(speed: number): void;
    /**
     * 修改背景的渲染比例，默认是 0.5
     *
     * 一般情况下这个程度既没有明显瑕疵也不会特别吃性能
     * @param scale 背景的渲染比例
     */
    setRenderScale(scale: number): void;
    private rebuildFilters;
    /**
     * 是否启用静态模式，即图片在更换后就会保持静止状态并禁用更新，以节省性能
     * @param enable 是否启用静态模式
     */
    setStaticMode(enable?: boolean): void;
    /**
     * 修改背景动画帧率，默认是 30 FPS
     *
     * 如果设置成 0 则会停止动画
     * @param fps 目标帧率，默认 30 FPS
     */
    setFPS(fps: number): void;
    /**
     * 暂停背景动画，画面即便是更新了图片也不会发生变化
     */
    pause(): void;
    /**
     * 恢复播放背景动画
     */
    resume(): void;
    /**
     * 设置背景专辑图片，图片材质加载并设置完成后会返回
     * @param albumUrl 图片的目标链接
     */
    setAlbumImage(albumUrl: string): Promise<void>;
    dispose(): void;
}

import { LyricPlayer } from ".";
import { Disposable, HasElement, LyricLine, LyricWord } from "../interfaces";
import { Spring } from "../utils/spring";
export declare function shouldEmphasize(word: LyricWord): boolean;
export declare class RawLyricLineMouseEvent extends MouseEvent {
    readonly line: LyricLineEl;
    constructor(line: LyricLineEl, event: MouseEvent);
}
type MouseEventMap = {
    [evt in keyof HTMLElementEventMap]: HTMLElementEventMap[evt] extends MouseEvent ? evt : never;
};
type MouseEventTypes = MouseEventMap[keyof MouseEventMap];
type MouseEventListener = (this: LyricLineEl, ev: RawLyricLineMouseEvent) => void;
export declare class LyricLineEl extends EventTarget implements HasElement, Disposable {
    private lyricPlayer;
    private lyricLine;
    private element;
    private left;
    private top;
    private scale;
    private blur;
    private delay;
    private splittedWords;
    lineSize: number[];
    readonly lineTransforms: {
        posX: Spring;
        posY: Spring;
        scale: Spring;
    };
    constructor(lyricPlayer: LyricPlayer, lyricLine?: LyricLine);
    private listenersMap;
    private readonly onMouseEvent;
    addEventListener(type: MouseEventTypes, callback: MouseEventListener | null, options?: boolean | AddEventListenerOptions | undefined): void;
    removeEventListener(type: MouseEventTypes, callback: MouseEventListener | null, options?: boolean | EventListenerOptions | undefined): void;
    private isEnabled;
    enable(): void;
    measureSize(): [number, number];
    disable(): void;
    setLine(line: LyricLine): void;
    getLine(): LyricLine;
    private _hide;
    private lastStyle;
    show(): void;
    hide(): void;
    rebuildStyle(): void;
    rebuildElement(): void;
    private initFloatAnimation;
    private initEmphasizeAnimation;
    updateMaskImage(): void;
    getElement(): HTMLElement;
    setTransform(left?: number, top?: number, scale?: number, opacity?: number, blur?: number, force?: boolean, delay?: number): void;
    update(delta?: number): void;
    get isInSight(): boolean;
    dispose(): void;
}
export {};

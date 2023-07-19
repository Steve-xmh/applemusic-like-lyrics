import { LyricPlayer } from ".";
import { Disposable, HasElement, LyricLine } from "../interfaces";
import { Spring } from "../utils/spring";
export declare class LyricLineEl implements HasElement, Disposable {
    private lyricPlayer;
    private lyricLine;
    private element;
    private currentTime;
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
    enable(): void;
    disable(): void;
    setLine(line: LyricLine): void;
    getLine(): LyricLine;
    private _hide;
    private lastStyle;
    show(): void;
    hide(): void;
    rebuildStyle(): void;
    rebuildElement(): void;
    updateMaskImage(): void;
    getElement(): HTMLElement;
    setTransform(left?: number, top?: number, scale?: number, opacity?: number, blur?: number, force?: boolean, delay?: number): void;
    update(delta?: number): void;
    get isInSight(): boolean;
    dispose(): void;
}

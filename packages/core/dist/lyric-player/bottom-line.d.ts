import { LyricPlayer } from ".";
import { Disposable, HasElement } from "../interfaces";
import { Spring } from "../utils/spring";
export declare class BottomLineEl implements HasElement, Disposable {
    private lyricPlayer;
    private element;
    private left;
    private top;
    private delay;
    lineSize: number[];
    readonly lineTransforms: {
        posX: Spring;
        posY: Spring;
    };
    constructor(lyricPlayer: LyricPlayer);
    measureSize(): [number, number];
    private lastStyle;
    show(): void;
    hide(): void;
    rebuildStyle(): void;
    getElement(): HTMLElement;
    setTransform(left?: number, top?: number, force?: boolean, delay?: number): void;
    update(delta?: number): void;
    get isInSight(): boolean;
    dispose(): void;
}

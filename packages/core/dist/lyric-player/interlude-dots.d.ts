import { LyricPlayer } from ".";
import type { Disposable, HasElement } from "../interfaces";
export declare class InterludeDots implements HasElement, Disposable {
    private readonly lyricPlayer;
    private element;
    private dot0;
    private dot1;
    private dot2;
    private left;
    private top;
    private scale;
    private lastStyle;
    private currentInterlude?;
    private currentTime;
    private targetBreatheDuration;
    constructor(lyricPlayer: LyricPlayer);
    getElement(): HTMLElement;
    setTransform(left?: number, top?: number): void;
    setInterlude(interlude?: [number, number]): void;
    update(delta?: number): void;
    dispose(): void;
}

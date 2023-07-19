import { LyricPlayer } from ".";
import type { Disposable, HasElement } from "../interfaces";
export declare class InterludeDots implements HasElement, Disposable {
    private lyricPlayer;
    private element;
    private dot0;
    private dot1;
    private dot2;
    constructor(lyricPlayer: LyricPlayer);
    getElement(): HTMLElement;
    dispose(): void;
}

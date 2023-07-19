/**
 * @fileoverview
 * 一个播放歌词的组件
 * @author SteveXMH
 */
import type { Disposable, HasElement, LyricLine } from "../interfaces";
import { SpringParams } from "../utils/spring";
export declare class LyricPlayer extends EventTarget implements HasElement, Disposable {
    private element;
    private currentTime;
    private lyricLines;
    private processedLines;
    private lyricLinesEl;
    private lyricLinesSize;
    private hotLines;
    private bufferedLines;
    private scrollToIndex;
    private resizeObserver;
    private enableBlur;
    size: [number, number];
    pos: [number, number];
    private interludeDots;
    readonly supportPlusLighter: boolean;
    readonly supportMaskImage: boolean;
    disableSpring: boolean;
    alignAnchor: "top" | "bottom" | number;
    /**
     * 设置是否使用物理弹簧算法实现歌词动画效果，默认启用
     *
     * 如果启用，则会通过弹簧算法实时处理歌词位置，但是需要性能足够强劲的电脑方可流畅运行
     *
     * 如果不启用，则会回退到基于 `transition` 的过渡效果，对低性能的机器比较友好，但是效果会比较单一
     */
    setEnableSpring(enable?: boolean): void;
    readonly style: import("jss").StyleSheet<"lyricPlayer" | "lyricLine" | "@media (max-width: 1024px)" | "lyricDuetLine" | "lyricBgLine" | "lyricMainLine" | "lyricSubLine" | "disableSpring" | "interludeDots" | "@supports (mix-blend-mode: plus-lighter)" | "tmpDisableTransition">;
    constructor();
    rebuildStyle(): void;
    /**
     * 设置是否启用歌词行的模糊效果
     * @param enable 是否启用
     */
    setEnableBlur(enable: boolean): void;
    /**
     * 设置当前播放歌词，要注意传入后这个数组内的信息不得修改，否则会发生错误
     * @param lines 歌词数组
     */
    setLyricLines(lines: LyricLine[]): void;
    calcLayout(reflow?: boolean): void;
    getCurrentTime(): number;
    getLyrics(): LyricLine[];
    getElement(): HTMLElement;
    /**
     * 设置当前播放进度，单位为毫秒且**必须是整数**，此时将会更新内部的歌词进度信息
     * 内部会根据调用间隔和播放进度自动决定如何滚动和显示歌词，所以这个的调用频率越快越准确越好
     *
     * 调用完成后，可以每帧调用 `update` 函数来执行歌词动画效果
     * @param time 当前播放进度，单位为毫秒
     */
    setCurrentTime(time: number, isSeek?: boolean): void;
    /**
     * 更新动画，这个函数应该逐帧调用
     * @param delta 距离上一次被调用到现在的时长，单位为毫秒（可为浮点数）
     */
    update(delta?: number): void;
    private posXSpringParams;
    private posYSpringParams;
    private scaleSpringParams;
    setLinePosXSpringParams(params: Partial<SpringParams>): void;
    setLinePosYSpringParams(params: Partial<SpringParams>): void;
    setLineScaleSpringParams(params: Partial<SpringParams>): void;
    dispose(): void;
}

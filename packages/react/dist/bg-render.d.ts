import { BackgroundRender as CoreBackgroundRender } from "@applemusic-like-lyrics/core";
import { type HTMLProps } from "react";
/**
 * 背景渲染组件的属性
 */
export interface BackgroundRenderProps {
    /**
     * 设置背景专辑图片
     */
    albumImageUrl?: string;
    /**
     * 设置当前背景动画帧率，如果为 `undefined` 则默认为 `30`
     */
    fps?: number;
    /**
     * 设置当前播放状态，如果为 `undefined` 则默认为 `true`
     */
    playing?: boolean;
    /**
     * 设置当前动画流动速度，如果为 `undefined` 则默认为 `2`
     */
    flowSpeed?: number;
    /**
     * 设置当前渲染缩放比例，如果为 `undefined` 则默认为 `0.5`
     */
    renderScale?: number;
    /**
     * 是否启用静态模式，即图片在更换后就会保持静止状态并禁用更新，以节省性能
     * 默认为 `false`
     */
    staticMode?: boolean;
}
/**
 * 背景渲染组件的引用
 */
export interface BackgroundRenderRef {
    /**
     * 背景渲染实例引用
     */
    bgRender?: CoreBackgroundRender;
    /**
     * 将背景渲染实例的元素包裹起来的 DIV 元素实例
     */
    wrapperEl: HTMLDivElement | null;
}
/**
 * 流体背景渲染组件，通过提供图片链接可以显示出酷似 Apple Music 的流体背景效果
 */
export declare const BackgroundRender: import("react").ForwardRefExoticComponent<Omit<HTMLProps<HTMLDivElement> & BackgroundRenderProps, "ref"> & import("react").RefAttributes<BackgroundRenderRef>>;

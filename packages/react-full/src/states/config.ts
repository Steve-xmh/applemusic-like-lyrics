/**
 * @fileoverview
 * 所有有关用户可配置的状态都在这里
 */

import { atom } from "jotai";
import { MeshGradientRenderer } from "@applemusic-like-lyrics/core";
import type { BackgroundRenderProps } from "@applemusic-like-lyrics/react";

// ======================== 歌词效果配置 ========================

/**
 * 是否启用歌词行模糊效果，默认启用
 *
 * 性能影响情况：高
 */
export const enableLyricLineBlurEffectAtom = atom(true);
/**
 * 是否启用歌词行缩放效果，默认启用
 *
 * 性能影响情况：无
 */
export const enableLyricLineScaleEffectAtom = atom(true);
/**
 * 是否启用歌词行弹簧动画效果，默认启用
 *
 * 如果禁用，则会回退到基础的 CSS 属性动画效果
 *
 * 性能影响情况：中
 */
export const enableLyricLineSpringAnimationAtom = atom(true);
/**
 * 是否显示翻译歌词行，默认启用
 *
 * 性能影响情况：低
 */
export const enableLyricTranslationLineAtom = atom(true);
/**
 * 是否显示音译歌词行，默认启用
 *
 * 性能影响情况：低
 */
export const enableLyricRomanLineAtom = atom(true);
/**
 * 是否交换音译歌词行和翻译歌词行，默认禁用
 *
 * 性能影响情况：无
 */
export const enableLyricSwapTransRomanLineAtom = atom(false);
/**
 * 调节逐词歌词时单词的渐变过渡宽度，单位为一个全角字的宽度，默认为 0.5
 *
 * 如果要模拟 Apple Music for Android 的效果，可以设置为 1
 *
 * 如果要模拟 Apple Music for iPad 的效果，可以设置为 0.5
 *
 * 如需关闭逐词歌词时单词的渐变过渡效果，可以设置为 0
 *
 * 性能影响情况：无
 */
export const lyricWordFadeWidth = atom(0.5);

// ======================== 歌词内容配置 ========================

/**
 * 调节全局歌词时间戳位移，单位为毫秒，正值为提前，负值为推迟，默认为 0
 *
 * 性能影响情况：无
 */
export const globalLyricTimelineOffsetAtom = atom(0);

// ======================== 歌词背景配置 ========================

/**
 * 配置所使用的歌词背景渲染器，默认使用 MeshGradientRenderer
 *
 * 性能影响情况：高
 */
export const lyricBackgroundRendererAtom =
	atom<BackgroundRenderProps["renderer"]>(MeshGradientRenderer);

/**
 * 调节背景的最大帧率，默认 60
 *
 * 性能影响情况：高
 */
export const lyricBackgroundFPSAtom = atom<BackgroundRenderProps["fps"]>(60);

/**
 * 调节背景的渲染倍率，默认为 1
 *
 * 性能影响情况：高
 */
export const lyricBackgroundRenderScaleAtom =
	atom<BackgroundRenderProps["renderScale"]>(1);

/**
 * 是否启用背景静态模式，即除了切换背景以外的情况都将停止渲染以优化性能，默认禁用
 *
 * 性能影响情况：中
 */
export const lyricBackgroundStaticModeAtom =
	atom<BackgroundRenderProps["staticMode"]>(false);

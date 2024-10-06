/**
 * @fileoverview
 * 所有有关 PrebuiltLyricPlayer 组件中用户可配置的状态都在这里
 * 如无特殊注明，此处所有配置均会被存储在 localStorage 中
 */

import {
	LyricPlayer as DefaultLyricPlayer,
	type LyricPlayerBase,
	MeshGradientRenderer,
} from "@applemusic-like-lyrics/core";
import type { BackgroundRenderProps } from "@applemusic-like-lyrics/react";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// ======================== 歌词效果配置 ========================

/**
 * 歌词播放组件的实现类型，默认为 `DefaultLyricPlayer`
 *
 * 由于存储状态特殊，故不使用 atomWithStorage，请另外处理配置存储
 *
 * 性能影响情况：高
 */
export const lyricPlayerImplementationAtom = atom<{
	lyricPlayer: {
		new (
			...args: ConstructorParameters<typeof LyricPlayerBase>
		): LyricPlayerBase;
	};
}>({
	lyricPlayer: DefaultLyricPlayer,
});
/**
 * 是否启用歌词行模糊效果，默认启用
 *
 * 性能影响情况：高
 */
export const enableLyricLineBlurEffectAtom = atomWithStorage(
	"amll-react-full.enableLyricLineBlurEffectAtom",
	true,
);
/**
 * 是否启用歌词行缩放效果，默认启用
 *
 * 性能影响情况：无
 */
export const enableLyricLineScaleEffectAtom = atomWithStorage(
	"amll-react-full.enableLyricLineScaleEffectAtom",
	true,
);
/**
 * 是否启用歌词行弹簧动画效果，默认启用
 *
 * 如果禁用，则会回退到基础的 CSS 属性动画效果
 *
 * 性能影响情况：中
 */
export const enableLyricLineSpringAnimationAtom = atomWithStorage(
	"amll-react-full.enableLyricLineSpringAnimationAtom",
	true,
);
/**
 * 是否显示翻译歌词行，默认启用
 *
 * 性能影响情况：低
 */
export const enableLyricTranslationLineAtom = atomWithStorage(
	"amll-react-full.enableLyricTranslationLineAtom",
	true,
);
/**
 * 是否显示音译歌词行，默认启用
 *
 * 性能影响情况：低
 */
export const enableLyricRomanLineAtom = atomWithStorage(
	"amll-react-full.enableLyricRomanLineAtom",
	true,
);
/**
 * 是否交换音译歌词行和翻译歌词行，默认禁用
 *
 * 性能影响情况：无
 */
export const enableLyricSwapTransRomanLineAtom = atomWithStorage(
	"amll-react-full.enableLyricSwapTransRomanLineAtom",
	false,
);
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
export const lyricWordFadeWidthAtom = atomWithStorage(
	"amll-react-full.lyricWordFadeWidth",
	0.5,
);
/**
 * 设置仅歌词组件的字体家族（CSS Font Family 属性），默认为空（即继承自父元素）
 */
export const lyricFontFamilyAtom = atomWithStorage(
	"amll-react-full.lyricFontFamily",
	"",
);
/**
 * 设置仅歌词组件的字体字重（CSS Font Weight 属性），默认为 0 （即继承自父元素）
 */
export const lyricFontWeightAtom = atomWithStorage(
	"amll-react-full.lyricFontWeight",
	0,
);
/**
 * 设置仅歌词组件的字符间距（CSS Font Weight 属性），默认为 0 （即继承自父元素）
 */
export const lyricLetterSpacingAtom = atomWithStorage(
	"amll-react-full.lyricLetterSpacing",
	"normal",
);

// ====================== 歌曲信息展示配置 ======================

export enum PlayerControlsType {
	Controls = "controls",
	FFT = "fft",
	None = "none",
}

/**
 * 播放器控制器类型，默认为 `PlayerControlsType.Controls`
 */
export const playerControlsTypeAtom = atomWithStorage(
	"amll-react-full.playerControlsType",
	PlayerControlsType.Controls,
);
/**
 * 是否显示歌曲名称，默认启用
 */
export const showMusicNameAtom = atomWithStorage(
	"amll-react-full.showMusicName",
	true,
);
export enum VerticalCoverLayout {
	Auto = "auto",
	ForceNormal = "force-normal",
	ForceImmersive = "force-immersive",
}
/**
 * 垂直布局下隐藏歌词时的专辑图布局模式
 * - Auto: 根据专辑图是否为视频切换沉浸布局
 * - ForceNormal: 强制使用默认布局
 * - ForceImmersive: 强制使用沉浸布局
 */
export const verticalCoverLayoutAtom = atomWithStorage(
	"amll-react-full.verticalCoverLayoutAtom",
	VerticalCoverLayout.Auto,
);
/**
 * 是否显示歌曲作者，默认启用
 */
export const showMusicArtistsAtom = atomWithStorage(
	"amll-react-full.showMusicArtists",
	true,
);
/**
 * 是否显示歌曲专辑名称，默认启用
 */
export const showMusicAlbumAtom = atomWithStorage(
	"amll-react-full.showMusicAlbum",
	false,
);
/**
 * 是否显示音量滑块条，默认启用
 */
export const showVolumeControlAtom = atomWithStorage(
	"amll-react-full.showVolumeControl",
	true,
);
/**
 * 是否显示底部控制按钮组，默认启用
 */
export const showBottomControlAtom = atomWithStorage(
	"amll-react-full.showBottomControl",
	true,
);

// ======================== 歌词内容配置 ========================

/**
 * 调节全局歌词时间戳位移，单位为毫秒，正值为提前，负值为推迟，默认为 0
 *
 * 性能影响情况：无
 */
export const globalLyricTimelineOffsetAtom = atomWithStorage(
	"amll-react-full.globalLyricTimelineOffsetAtom",
	0,
);

// ======================== 歌词背景配置 ========================

/**
 * 配置所使用的歌词背景渲染器，默认使用 MeshGradientRenderer
 *
 * 由于存储状态特殊，故不使用 atomWithStorage，请另外处理配置存储
 *
 * 性能影响情况：高
 */
export const lyricBackgroundRendererAtom = atom<{
	renderer: BackgroundRenderProps["renderer"];
}>({
	renderer: MeshGradientRenderer,
});

/**
 * 调节背景的最大帧率，默认 60
 *
 * 性能影响情况：高
 */
export const lyricBackgroundFPSAtom = atomWithStorage<
	NonNullable<BackgroundRenderProps["fps"]>
>("amll-react-full.lyricBackgroundFPSAtom", 60);

/**
 * 调节背景的渲染倍率，默认为 1
 *
 * 性能影响情况：高
 */
export const lyricBackgroundRenderScaleAtom = atomWithStorage<
	NonNullable<BackgroundRenderProps["renderScale"]>
>("amll-react-full.lyricBackgroundRenderScaleAtom", 1);

/**
 * 是否启用背景静态模式，即除了切换背景以外的情况都将停止渲染以优化性能，默认禁用
 *
 * 性能影响情况：中
 */
export const lyricBackgroundStaticModeAtom = atomWithStorage<
	NonNullable<BackgroundRenderProps["staticMode"]>
>("amll-react-full.lyricBackgroundStaticModeAtom", false);

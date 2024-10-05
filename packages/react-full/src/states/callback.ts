/**
 * @fileoverview
 * 所有有关 PrebuiltLyricPlayer 组件中开发者需要在预设歌词组件中配置的回调函数状态在这里
 */

import type { LyricLineMouseEvent } from "@applemusic-like-lyrics/core";
import type { LyricPlayerProps } from "@applemusic-like-lyrics/react";
import { atom } from "jotai";

export interface Callback<Args extends any[], Result = void> {
	onEmit?: (...args: Args) => Result;
}

const c = <Args extends any[], Result = void>(
	_onEmit: (...args: Args) => Result,
): Callback<Args, Result> => ({});

/**
 * 当点击歌曲专辑图上方的控制横条按钮时触发的回调函数
 */
export const onClickControlThumbAtom = atom(c(() => {}));
/**
 * 当点击音质标签时触发
 */
export const onClickAudioQualityTagAtom = atom(c(() => {}));
/**
 * 当任意企图打开菜单或点击菜单按钮时触发的回调函数
 */
export const onRequestOpenMenuAtom = atom(c(() => {}));

/**
 * 当触发播放或恢复播放时触发的回调函数
 */
export const onPlayOrResumeAtom = atom(c(() => {}));

/**
 * 当触发暂停播放时触发的回调函数
 */
export const onPauseAtom = atom(c(() => {}));

/**
 * 当触发上一首歌曲时触发的回调函数
 */
export const onRequestPrevSongAtom = atom(c(() => {}));

/**
 * 当触发下一首歌曲时触发的回调函数
 */
export const onRequestNextSongAtom = atom(c(() => {}));
/**
 * 当触发设置歌曲播放位置时触发的回调函数
 * @param _position 播放位置，单位为毫秒
 */
export const onSeekPositionAtom = atom(c((_position: number) => {}));
/**
 * 当点击歌词行时触发的回调函数
 * @param _evt 对应的歌词行事件对象
 */
export const onLyricLineClickAtom = atom(
	c(((_evt: LyricLineMouseEvent) => {}) as NonNullable<
		LyricPlayerProps["onLyricLineClick"]
	>),
);
/**
 * 当试图对歌词行打开上下文菜单（例如右键点击）时触发的回调函数
 * @param _evt 对应的歌词行事件对象
 */
export const onLyricLineContextMenuAtom = atom(
	c(((_evt: LyricLineMouseEvent) => {}) as NonNullable<
		LyricPlayerProps["onLyricLineContextMenu"]
	>),
);
/**
 * 当触发设置音量大小时触发的回调函数
 * @param _volume 音量大小，取值范围为 [0-1]
 */
export const onChangeVolumeAtom = atom(c((_volume: number) => {}));
/**
 * 当点击位于控制按钮左侧的按钮时触发的回调函数
 */
export const onClickLeftFunctionButtonAtom = atom(c(() => {}));

/**
 * 当点击位于控制按钮右侧的按钮时触发的回调函数
 */
export const onClickRightFunctionButtonAtom = atom(c(() => {}));

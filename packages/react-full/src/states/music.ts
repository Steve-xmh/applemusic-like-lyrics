/**
 * @fileoverview
 * 所有有关开发者需要在预设歌词组件中根据当前播放内容实时更新的状态都在这里
 */

import { atom } from "jotai";

/**
 * 当前播放的音乐名称，将会显示在专辑图下方（横向布局）或专辑图右侧（竖向布局）
 */
export const musicNameAtom = atom("");
/**
 * 当前播放的音乐名称，将会显示在专辑图下方（横向布局）或专辑图右侧（竖向布局）
 */
export const musicArtistsAtom = atom("");

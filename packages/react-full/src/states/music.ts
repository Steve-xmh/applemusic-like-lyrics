/**
 * @fileoverview
 * 所有有关开发者需要在预设歌词组件中根据当前播放内容实时更新的状态都在这里
 */

import { atom } from "jotai";
import type { LyricLine } from "@applemusic-like-lyrics/core";

export interface ArtistStateEntry {
	name: string;
	id: string;
}

export enum AudioQualityType {
	None = "none",
	Lossless = "lossless",
	HiRes = "hires",
	DolbyAtmos = "dolby-atmos",
}

/**
 * 当前播放的音乐名称，将会显示在专辑图下方（横向布局）或专辑图右侧（竖向布局）
 */
export const musicNameAtom = atom("未知歌曲");
/**
 * 当前播放的音乐创作者列表，会显示在音乐名称下方
 */
export const musicArtistsAtom = atom<ArtistStateEntry[]>([
	{
		name: "未知创作者",
		id: "unknown",
	},
]);
/**
 * 当前播放的音乐所属专辑名称，会显示在音乐名称/创作者下方
 */
export const musicAlbumNameAtom = atom("未知专辑");
/**
 * 当前播放的音乐专辑封面 URL，除了图片也可以是视频资源
 */
export const musicCoverAtom = atom("");
/**
 * 当前播放的音乐专辑封面资源是否为视频
 */
export const musicCoverIsVideoAtom = atom(false);
/**
 * 当前是否正在播放音乐
 */
export const musicPlayingAtom = atom(false);
/**
 * 当前音乐的播放进度，单位为毫秒
 */
export const musicPlayingPositionAtom = atom(false);
/**
 * 当前播放的音乐专辑封面 URL，除了图片也可以是视频资源
 */
export const musicLyricLinesAtom = atom<LyricLine[]>([]);
/**
 * 是否隐藏垂直布局下的歌词视图
 */
export const hideVerticalLyricViewAtom = atom(false);

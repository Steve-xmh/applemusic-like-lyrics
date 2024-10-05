/**
 * @fileoverview
 * 所有有关 PrebuiltLyricPlayer 组件中开发者需要在预设歌词组件中根据当前播放内容实时更新的状态都在这里
 */

import type { LyricLine } from "@applemusic-like-lyrics/core";
import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

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
 * 当前音乐的音乐时长，单位为毫秒
 */
export const musicDurationAtom = atom(0);
/**
 * 当前是否正在播放音乐
 */
export const musicPlayingAtom = atom(false);
/**
 * 当前音乐的音质水平标签信息，如有提供则会显示在进度条下
 */
export const musicQualityTagAtom = atom<{
	tagIcon: boolean;
	tagText: string;
	isDolbyAtmos: boolean;
} | null>(null);
/**
 * 当前音乐的播放进度，单位为毫秒
 */
export const musicPlayingPositionAtom = atom(0);
/**
 * 当前播放的音乐音量大小，范围在 [0.0-1.0] 之间
 *
 * 本状态将会保存在 localStorage 中
 */
export const musicVolumeAtom = atomWithStorage(
	"amll-react-full.musicVolumeAtom",
	0.5,
);
/**
 * 当前播放的音乐专辑封面 URL，除了图片也可以是视频资源
 */
export const musicLyricLinesAtom = atom<LyricLine[]>([]);
/**
 * 是否隐藏歌词视图
 */
export const hideLyricViewAtom = atomWithStorage(
	"amll-react-full.hideLyricViewAtom",
	false,
);
/**
 * 用于音频可视化频谱图的数据
 * 如需呈现背景跳动效果，请设置 lowFreqVolumeAtom 的值
 */
export const fftDataAtom = atom<number[]>([]);
/**
 * 低频音量大小，范围在 80hz-120hz 之间为宜，取值范围在 [0.0-1.0] 之间
 *
 * 如果无法获取到类似的数据，请传入 undefined 或 1.0 作为默认值，或不做任何处理（默认值即 1.0）
 *
 * 如需呈现音频可视化频谱图，请设置 fftDataAtom 的值
 */
export const lowFreqVolumeAtom = atom<number>(1);
/**
 * 当前是否正在展示 AMLL 播放页面，设置为 true 时将会让背景和歌词实时展示动画效果
 * 推荐在页面被隐藏的时候将其设置为 false，这样会减少其对性能的影响（例如暂停背景渲染和歌词行变换等）
 */
export const isLyricPageOpenedAtom = atom(false);

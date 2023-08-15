/**
 * @fileoverview
 * 用于将内部歌词数组对象导出成 TTML 格式的模块
 * 但是可能会有信息会丢失
 */
import type { LyricLine } from "@applemusic-like-lyrics/core";
export declare function stringifyTTML(lyric: LyricLine[], pretty?: boolean): string;

/**
 * @fileoverview
 * 一个统一的歌词来源结构
 */

/**
 * 歌词文件格式
 */
export enum LyricFormat {
	LRC = "lrc",
	TTML = "ttml",
	YRC = "yrc",
	QRC = "qrc",
	LYS = "lys",
}

/**
 * 一个歌词源
 */
export interface LyricSource {
	/**
	 * 歌词来源链接，支持以下替换符号：
	 * - `[NCM_ID]`: 网易云的音乐ID
	 * - `[SONG_NAME]`: 歌名
	 * - `[SONG_NAME_URI]`: 歌名，但是会先经过 `encodeURIComponent` 编码
	 * - `[SONG_ARTIST]`: 以 `,` 分隔的歌手名称
	 * - `[SONG_ARTIST_URI]`: 以 `,` 分隔的歌手名称，但是会先经过 `encodeURIComponent` 编码
	 * - `[SONG_ALIAS]`: 歌名的其他称谓，如果没有则为空
	 * - `[SONG_ALIAS_URI]`: 歌名的其他称谓，但是会先经过 `encodeURIComponent` 编码，如果没有则为空
	 */
	url: string;
	/**
	 * 歌词源提供的歌词文件格式
	 */
	format: LyricFormat;
	/**
	 * 歌词源的名字
	 */
	name?: string;
	/**
	 * 歌词来源的一个网站页面，将会显示在歌词源设置中以供用户前往
	 */
	website?: string;
}

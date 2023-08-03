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
 *
 * 为了能够更加方便地保存/取用和分享歌词源，此处定义一个歌词来源字符串格式：
 * 以 `|` 分隔各个信息的形式存储每个需要的信息
 * `歌词源UUID|歌词源名称|歌词源说明|歌词类型|歌词源模板链接`
 * 这分隔的四个参数中，除了模板链接不可为空以外，其他参数都是可以留空的，导入时将会自动生成对应的默认值
 * 但是 `|` 符号需要保留，以确保正确分隔参数
 * 目前只使用 4 个参数，今后可能会根据需求增加更多参数。
 * - 歌词源UUID：用于唯一确认歌词源是否重复，如果重复则导入时将会覆盖原有歌词源，如果留空则会调用 `crypto.randomUUID()` 生成一个新的 UUID。
 * - 歌词源名称：将会显示在歌词源设置中的名称，需要进行 URI 编码，如果留空则默认将根据其他参数情况生成一个便于理解的名称（例如 `来自 github.com 的歌词源`）
 * - 歌词源说明：将会显示在歌词源设置中的说明文本，需要进行 URI 编码，如果留空则默认为空
 * - 歌词类型：可以是上面 `LyricFormat` 枚举中的任意字符串字面量，例如 `ttml` `lys` 等
 * - 歌词源模板链接：用于获取歌词的一个模板链接，支持一些替换符号，详情见接口中的 `url` 属性
 * 
 * 以 Steve-xmh/amll-ttml-db 为例子，一种可能的歌词源链接格式可以是：
 * `b39e8a1d-5c17-4f03-907a-efbf612f19c4|AMLL%20%E6%AD%8C%E8%AF%8D%E6%95%B0%E6%8D%AE%E5%BA%93|%E4%BD%9C%E8%80%85%E7%89%B9%E4%BE%9B%E7%BB%99%20AMLL%20%E7%9A%84%20TTML%20%E9%80%90%E8%AF%8D%E6%AD%8C%E8%AF%8D%E5%BA%93|ttml|https://raw.githubusercontent.com/Steve-xmh/amll-ttml-db/main/lyrics/[NCM_ID].ttml`
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

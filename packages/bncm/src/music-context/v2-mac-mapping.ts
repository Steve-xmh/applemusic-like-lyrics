/**
 * @fileoverview
 * 此处存放每个 macOS 版本对应的函数对照表
 * 由于 Safari 的潜在问题，对函数使用 toString 会返回不正确的字符串源代码结果，导致函数搜索失败
 * 因此，此处使用每次的包版本号作为 key，函数名作为 value
 */

export const V2_MAC_TRACKMAPPING: {
	[packageVersion: string]: string | undefined;
} = {
	"755f2e4": "baF",
	"e19f4e3": "baF",
};

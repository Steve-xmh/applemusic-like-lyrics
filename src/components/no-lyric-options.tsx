/**
 * @fileoverview
 * 在没有可用歌词的情况下显示的使用其他歌词来源的选项组件
 */
import * as React from "react";

export const NoLyricOptions: React.FC = () => {
	return (
		<div className="am-lyric-view-no-lyric">
			<div>没有可用歌词，但是你可以通过菜单手动指定需要使用的歌词。</div>
			<div>
				如果你确信是有歌词的，那么有可能是网络问题或者插件出错，请再多次尝试或更新网易云解决。
			</div>
		</div>
	);
};

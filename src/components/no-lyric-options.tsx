/**
 * @fileoverview
 * 在没有可用歌词的情况下显示的使用其他歌词来源的选项组件
 */
import * as React from "react";
import { Text } from "@mantine/core";

export const NoLyricOptions: React.FC = () => {
	return (
		<div className="am-lyric-view-no-lyric">
			<Text fz="md">
				没有可用歌词，但是你可以通过右上角的菜单手动指定需要使用的歌词。
			</Text>
		</div>
	);
};

/**
 * @fileoverview
 * 一个适用于歌词页面横向布局的组件
 */

import { HTMLProps } from "react";
import classnames from "classnames";
import styles from "./horizontal.module.css";

export const HorizontalLayout: React.FC<
	{
		thumbSlot?: React.ReactNode;
		coverSlot?: React.ReactNode;
		controlsSlot?: React.ReactNode;
		lyricSlot?: React.ReactNode;
		hideLyric?: boolean;
	} & HTMLProps<HTMLDivElement>
> = ({
	thumbSlot,
	coverSlot,
	controlsSlot,
	lyricSlot,
	hideLyric,
	className,
	...rest
}) => {
	return (
		<div
			className={classnames(
				styles.horizontalLayout,
				hideLyric && styles.hideLyric,
				className,
			)}
			{...rest}
		>
			<div className={styles.thumb}>{thumbSlot}</div>
			<div className={styles.cover}>{coverSlot}</div>
			<div className={styles.controls}>{controlsSlot}</div>
			<div className={styles.lyric}>{lyricSlot}</div>
		</div>
	);
};

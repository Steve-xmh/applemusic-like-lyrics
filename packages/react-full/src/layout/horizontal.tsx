/**
 * @fileoverview
 * 一个适用于歌词页面横向布局的组件
 */

import classnames from "classnames";
import type React from "react";
import type { HTMLProps, Ref } from "react";
import { useMotionElementRef } from "../utils/useMotionElementRef";
import styles from "./horizontal.module.css";

export const HorizontalLayout: React.FC<
	{
		thumbSlot?: React.ReactNode;
		coverSlot?: React.ReactNode;
		coverFrameRef?: Ref<HTMLDivElement>;
		controlsSlot?: React.ReactNode;
		lyricSlot?: React.ReactNode;
		backgroundSlot?: React.ReactNode;
		bottomControls?: React.ReactNode;
		hideLyric?: boolean;
		asChild?: boolean;
	} & HTMLProps<HTMLDivElement>
> = ({
	thumbSlot,
	coverSlot,
	coverFrameRef,
	controlsSlot,
	lyricSlot,
	bottomControls,
	hideLyric,
	className,
	asChild,
	...rest
}) => {
	const frameRef = useMotionElementRef(coverFrameRef);
	return (
		<div
			className={classnames(
				className,
				!asChild && styles.horizontalLayout,
				!asChild && hideLyric && styles.hideLyric,
			)}
			{...rest}
		>
			{/*
				这几个槽位刻意不用 framer-motion 的 layout 动画。
				进度条上的音质标签用 `AnimatePresence mode="popLayout"` 退场时，
				会把整棵投影树的快照重置一遍，切歌那一下这些节点会拿失效的快照
				做 translate + scale，表现就是封面瞬间缩小跑到左上角再弹回。
				尺寸/位置变化本来就有 CSS 过渡（见 horizontal.module.css），够用。
			*/}
			<div className={styles.thumb}>{thumbSlot}</div>
			<div className={styles.cover} ref={frameRef}>
				{coverSlot}
			</div>
			<div className={styles.controls}>{controlsSlot}</div>
			<div className={styles.lyric}>{lyricSlot}</div>
			<div className={styles.bottomControls}>{bottomControls}</div>
		</div>
	);
};

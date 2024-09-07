/**
 * @fileoverview
 * 一个适用于歌词页面竖向布局的组件
 */

import classNames from "classnames";
import { type MotionProps, motion } from "framer-motion";
import type { HTMLProps } from "react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import styles from "./vertical.module.css";

export const VerticalLayout: React.FC<
	{
		thumbSlot?: React.ReactNode;
		smallControlsSlot?: React.ReactNode;
		bigControlsSlot?: React.ReactNode;
		coverSlot?: React.ReactNode;
		lyricSlot?: React.ReactNode;
		asChild?: boolean;
		hideLyric?: boolean;
	} & HTMLProps<HTMLDivElement>
> = ({
	thumbSlot,
	coverSlot,
	smallControlsSlot,
	bigControlsSlot,
	lyricSlot,
	hideLyric,
	asChild,
	className,
	...rest
}) => {
	const rootRef = useRef<HTMLDivElement>(null);
	const phonyBigCoverRef = useRef<HTMLDivElement>(null);
	const phonySmallCoverRef = useRef<HTMLDivElement>(null);
	const coverFrameRef = useRef<HTMLDivElement>(null);
	const hideLyricRef = useRef(hideLyric ?? false);
	const [currentCoverStyle, setCurrentCoverStyle] = useState<
		MotionProps["animate"]
	>({});
	const updateCoverLayout = useCallback((hideLyric = hideLyricRef.current) => {
		if (!rootRef.current) return;
		let rootEl: HTMLElement = rootRef.current;
		const targetCover = hideLyric
			? phonyBigCoverRef.current
			: phonySmallCoverRef.current;
		if (!targetCover || !rootEl) return;
		const targetCoverSize = Math.min(
			targetCover.clientWidth,
			targetCover.clientHeight,
		);
		while (getComputedStyle(rootEl).display === "contents") {
			rootEl = rootEl.parentElement!;
		}
		const rootB = rootEl.getBoundingClientRect();
		const targetCoverB = targetCover.getBoundingClientRect();
		const targetCoverLeft =
			targetCoverB.x - rootB.x + (targetCoverB.width - targetCoverSize) / 2;
		const targetCoverTop =
			targetCoverB.y - rootB.y + (targetCoverB.height - targetCoverSize) / 2;
		setCurrentCoverStyle({
			width: targetCoverSize,
			height: targetCoverSize,
			left: targetCoverLeft,
			top: targetCoverTop,
		});
	}, []);
	useLayoutEffect(() => {
		const phonyBigCoverEl = phonyBigCoverRef.current;
		const phonySmallCoverEl = phonySmallCoverRef.current;
		// const coverFrameEl = coverFrameRef.current;
		if (!phonyBigCoverEl || !phonySmallCoverEl) return;
		const obz = new ResizeObserver(() => {
			updateCoverLayout(hideLyricRef.current);
		});
		obz.observe(phonyBigCoverEl);
		obz.observe(phonySmallCoverEl);
		updateCoverLayout(hideLyricRef.current);
		return () => {
			obz.disconnect();
		};
	}, [updateCoverLayout]);
	useLayoutEffect(() => {
		hideLyricRef.current = hideLyric ?? false;
		updateCoverLayout(hideLyricRef.current);
	}, [hideLyric, updateCoverLayout]);
	return (
		<div
			className={classNames(
				className,
				!asChild && styles.verticalLayout,
				!asChild && hideLyric && styles.hideLyric,
			)}
			ref={rootRef}
			{...rest}
		>
			<div className={styles.thumb}>{thumbSlot}</div>
			<div className={styles.lyricLayout}>
				{/** 用于占位，测量布局的大小用 */}
				<div className={styles.phonySmallCover} ref={phonySmallCoverRef} />
				<div className={styles.smallControls}>{smallControlsSlot}</div>
				<div className={styles.lyric}>{lyricSlot}</div>
			</div>
			<div className={styles.noLyricLayout}>
				{/** 用于占位，测量布局的大小用 */}
				<div className={styles.phonyBigCover} ref={phonyBigCoverRef} />
				<div className={styles.bigControls}>{bigControlsSlot}</div>
			</div>
			<motion.div
				className={styles.coverFrame}
				animate={currentCoverStyle}
				transition={{
					type: "spring",
					stiffness: 200,
					damping: 30,
				}}
				ref={coverFrameRef}
			>
				{coverSlot}
			</motion.div>
		</div>
	);
};

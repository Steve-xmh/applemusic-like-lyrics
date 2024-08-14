/**
 * @fileoverview
 * 一个适用于歌词页面竖向布局的组件
 */

import { HTMLProps, useCallback, useLayoutEffect, useRef } from "react";
import styles from "./vertical.module.css";
import classNames from "classnames";

export const VerticalLayout: React.FC<
	{
		thumbSlot?: React.ReactNode;
		smallControlsSlot?: React.ReactNode;
		bigControlsSlot?: React.ReactNode;
		coverSlot?: React.ReactNode;
		lyricSlot?: React.ReactNode;
		hideLyric?: boolean;
	} & HTMLProps<HTMLDivElement>
> = ({
	thumbSlot,
	coverSlot,
	smallControlsSlot,
	bigControlsSlot,
	lyricSlot,
	hideLyric,
	...rest
}) => {
	const rootRef = useRef<HTMLDivElement>(null);
	const phonyBigCoverRef = useRef<HTMLDivElement>(null);
	const phonySmallCoverRef = useRef<HTMLDivElement>(null);
	const coverFrameRef = useRef<HTMLDivElement>(null);
	const hideLyricRef = useRef(hideLyric ?? false);
	const updateCoverLayout = useCallback(
		(hideLyric = hideLyricRef.current, force = false) => {
			const rootEl = rootRef.current;
			const targetCover = hideLyric
				? phonyBigCoverRef.current
				: phonySmallCoverRef.current;
			const coverFrameEl = coverFrameRef.current;
			if (!targetCover || !coverFrameEl || !rootEl) return;
			const targetCoverWidth = targetCover.clientWidth;
			const targetCoverHeight = targetCover.clientHeight;
			const rootB = rootEl.getBoundingClientRect();
			const targetCoverB = targetCover.getBoundingClientRect();
			const targetCoverLeft = targetCoverB.x - rootB.x;
			const targetCoverTop = targetCoverB.y - rootB.y;
			const transitionValue = force ? "none" : "all 0.5s ease-out";
			if (transitionValue !== coverFrameEl.style.transition) {
				coverFrameEl.style.transition = transitionValue;
			}
			coverFrameEl.style.width = `${targetCoverWidth}px`;
			coverFrameEl.style.height = `${targetCoverHeight}px`;
			coverFrameEl.style.left = `${targetCoverLeft}px`;
			coverFrameEl.style.top = `${targetCoverTop}px`;
		},
		[],
	);
	useLayoutEffect(() => {
		const phonyBigCoverEl = phonyBigCoverRef.current;
		const phonySmallCoverEl = phonySmallCoverRef.current;
		const coverFrameEl = coverFrameRef.current;
		if (!phonyBigCoverEl || !phonySmallCoverEl || !coverFrameEl) return;
		const obz = new ResizeObserver(() => {
			updateCoverLayout(hideLyricRef.current, true);
		});
		obz.observe(phonyBigCoverEl);
		obz.observe(phonySmallCoverEl);
		updateCoverLayout(hideLyricRef.current, true);
		return () => {
			obz.disconnect();
		};
	}, [updateCoverLayout]);
	useLayoutEffect(() => {
		hideLyricRef.current = hideLyric ?? false;
		updateCoverLayout(hideLyricRef.current, false);
	}, [hideLyric, updateCoverLayout]);
	return (
		<div className={styles.verticalLayout} ref={rootRef} {...rest}>
			<div className={styles.thumb}>{thumbSlot}</div>
			<div className={styles.lyricLayout}>
				{/** 用于占位，测量布局的大小用 */}
				<div className={styles.phonySmallCover} ref={phonySmallCoverRef} />
				<div
					className={classNames(
						styles.smallControls,
						hideLyric && styles.hideLyric,
					)}
				>
					{smallControlsSlot}
				</div>
				<div
					className={classNames(styles.lyric, hideLyric && styles.hideLyric)}
				>
					{lyricSlot}
				</div>
			</div>
			<div className={styles.noLyricLayout}>
				{/** 用于占位，测量布局的大小用 */}
				<div className={styles.phonyBigCover} ref={phonyBigCoverRef} />
				<div
					className={classNames(
						styles.bigControls,
						hideLyric && styles.hideLyric,
					)}
				>
					{bigControlsSlot}
				</div>
			</div>
			<div className={styles.coverFrame}>
				<div className={styles.cover} ref={coverFrameRef}>
					{coverSlot}
				</div>
			</div>
		</div>
	);
};

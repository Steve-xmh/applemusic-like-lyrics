/**
 * @fileoverview
 * 一个专辑图组件
 */

import classNames from "classnames";
import { type HTMLProps, forwardRef, useEffect, useMemo, useRef } from "react";
import styles from "./index.module.css";

/**
 * 一个专辑图组件
 */
export const Cover = forwardRef<
	HTMLElement,
	{
		coverUrl?: string;
		coverIsVideo?: boolean;
		coverVideoPaused?: boolean;
		musicPaused?: boolean;
		pauseShrinkAspect?: number;
	} & HTMLProps<HTMLElement>
>(
	(
		{
			coverUrl,
			coverIsVideo,
			coverVideoPaused,
			className,
			musicPaused,
			pauseShrinkAspect,
			...rest
		},
		ref,
	) => {
		const clsNames = useMemo(
			() =>
				classNames(styles.cover, musicPaused && styles.musicPaused, className),
			[className, musicPaused],
		);
		const videoRef = useRef<HTMLVideoElement>(null);
		useEffect(() => {
			const videoEl = videoRef.current;
			if (videoEl) {
				if (coverVideoPaused) {
					videoEl.pause();
				} else {
					videoEl.play();
				}
			}
		}, [coverVideoPaused]);
		if (coverIsVideo) {
			return (
				<video
					className={clsNames}
					src={coverUrl}
					style={{
						"--scale-level": pauseShrinkAspect ?? 0.75,
					}}
					autoPlay
					loop
					muted
					playsInline
					crossOrigin="anonymous"
					ref={videoRef as any}
					{...rest}
				/>
			);
		}
		return (
			<div
				className={clsNames}
				style={{
					backgroundImage: `url(${coverUrl})`,
					"--scale-level": pauseShrinkAspect ?? 0.75,
				}}
				alt="cover"
				ref={ref as any}
				{...rest}
			/>
		);
	},
);

/**
 * @fileoverview
 * 一个专辑图组件
 */

import classNames from "classnames";
import { forwardRef, type HTMLProps, type PropsWithRef, useRef } from "react";
import styles from "./index.module.css";
import { useMemo } from "react";
import { useEffect } from "react";

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
	} & HTMLProps<HTMLElement>
>(
	(
		{
			coverUrl,
			coverIsVideo,
			coverVideoPaused,
			className,
			musicPaused,
			...rest
		},
		ref,
	) => {
		const clsNames = useMemo(
			() => classNames(styles.cover, musicPaused && styles.paused, className),
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
					autoPlay
					loop
					muted
					playsInline
					crossOrigin="anonymous"
					ref={videoRef}
					{...rest}
				/>
			);
		}
		return (
			<div
				className={clsNames}
				style={{ backgroundImage: `url(${coverUrl})` }}
				alt="cover"
				ref={ref}
				{...rest}
			/>
		);
	},
);

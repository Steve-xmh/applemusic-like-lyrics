import type { HTMLProps } from "react";
import { useState, useRef } from "react";

import styles from "./auto.module.css";
import classNames from "classnames";
import { useLayoutEffect } from "react";
import { VerticalLayout } from "./vertical";
import { HorizontalLayout } from "./horizontal";

/**
 * 会根据当前元素的宽高比自动选择横向或者纵向布局的组件
 */
export const AutoLyricLayout: React.FC<
	{
		thumbSlot?: React.ReactNode;
		controlsSlot?: React.ReactNode;
		smallControlsSlot?: React.ReactNode;
		bigControlsSlot?: React.ReactNode;
		coverSlot?: React.ReactNode;
		lyricSlot?: React.ReactNode;
		backgroundSlot?: React.ReactNode;
		hideLyric?: boolean;
	} & HTMLProps<HTMLDivElement>
> = ({
	thumbSlot,
	controlsSlot,
	smallControlsSlot,
	bigControlsSlot,
	coverSlot,
	lyricSlot,
	backgroundSlot,
	hideLyric,
	className,
	...rest
}) => {
	const [isVertical, setIsVertical] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const rootEl = rootRef.current;
		if (!rootEl) return;
		setIsVertical(rootEl.clientWidth < rootEl.clientHeight);
		const obz = new ResizeObserver(() => {
			const rootB = rootEl.getBoundingClientRect();
			setIsVertical(rootB.width < rootB.height);
		});
		obz.observe(rootEl);
		return () => obz.disconnect();
	}, []);

	return (
		<div
			ref={rootRef}
			className={classNames(styles.autoLyricLayout, className)}
			{...rest}
		>
			<div>{backgroundSlot}</div>
			<div>
				{isVertical ? (
					<VerticalLayout
						thumbSlot={thumbSlot}
						smallControlsSlot={smallControlsSlot}
						bigControlsSlot={bigControlsSlot}
						coverSlot={coverSlot}
						lyricSlot={lyricSlot}
						hideLyric={hideLyric}
					/>
				) : (
					<HorizontalLayout
						thumbSlot={thumbSlot}
						controlsSlot={controlsSlot}
						coverSlot={coverSlot}
						lyricSlot={lyricSlot}
						hideLyric={hideLyric}
					/>
				)}
			</div>
		</div>
	);
};

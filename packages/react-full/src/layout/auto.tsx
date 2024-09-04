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

	// 如果分开使用两个布局，会导致不能衔接背景组件，导致两者间切换有闪屏情况
	// 如果直接使用背景并各套一个 div，会导致无法应用 plus-lighter 效果
	// 故借助 display: contents 来融合布局

	return (
		<div ref={rootRef} {...rest}>
			<div className={styles.background}>{backgroundSlot}</div>
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
					// style={{ display: "contents" }}
					// asChild
					thumbSlot={thumbSlot}
					controlsSlot={controlsSlot}
					coverSlot={coverSlot}
					lyricSlot={lyricSlot}
					hideLyric={hideLyric}
				/>
			)}
		</div>
	);
};

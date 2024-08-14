import { HTMLProps } from "react";

import styles from "./auto.module.css";

/**
 * 会根据当前视窗宽高比自动选择横向或者纵向布局的组件
 *
 * 此组件假设被全屏放置
 */
export const AutoLyricLayout: React.FC<
	{
		thumbSlot?: React.ReactNode;
		controlsSlot?: React.ReactNode;
		smallControlsSlot?: React.ReactNode;
		bigControlsSlot?: React.ReactNode;
		coverSlot?: React.ReactNode;
		lyricSlot?: React.ReactNode;
		hideLyric?: boolean;
	} & HTMLProps<HTMLDivElement>
> = ({
	thumbSlot,
	controlsSlot,
	smallControlsSlot,
	bigControlsSlot,
	coverSlot,
	lyricSlot,
	hideLyric,
	...rest
}) => {
	return <div className={styles.autoLyricLayout}></div>;
};

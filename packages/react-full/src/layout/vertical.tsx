/**
 * @fileoverview
 * 一个适用于歌词页面竖向布局的组件
 */

import { HTMLProps, useCallback } from "react";
import styles from "./vertical.module.css";

export const VerticalLayout: React.FC<{
    thumbSlot?: React.ReactNode;
    smallControlsSlot?: React.ReactNode;
    bigControlsSlot?: React.ReactNode;
    coverSlot?: React.ReactNode;
    lyricSlot?: React.ReactNode;
    hideLyric?: boolean;
} & HTMLProps<HTMLDivElement>> = ({
    thumbSlot,
    coverSlot,
    smallControlsSlot,
    bigControlsSlot,
    lyricSlot,
    hideLyric,
    ...rest
}) => {
        const updateCoverLayout = useCallback(() => {
            
        }, [hideLyric]);
        return (
            <div className={styles.verticalLayout} {...rest}>
                <div className={styles.thumb}>{thumbSlot}</div>
                <div className={styles.lyricLayout}>
                    <div className={styles.phonySmallCover} />
                    <div className={styles.smallControls}>{smallControlsSlot}</div>
                    <div className={styles.lyric}>{lyricSlot}</div>
                </div>
                <div className={styles.noLyricLayout}>
                    <div className={styles.phonyBigCover} />
                    <div className={styles.bigControls}>{bigControlsSlot}</div>
                </div>
                <div className={styles.cover}>{coverSlot}</div>
            </div>
        );
    };

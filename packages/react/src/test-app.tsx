import { LyricPlayer, type LyricPlayerRef } from "./lyric-player";
import { BackgroundRender } from "./bg-render";
import type { FC } from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { ttml } from "@applemusic-like-lyrics/core";
import type { LyricLine } from "@applemusic-like-lyrics/core";

export const App: FC = () => {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [audioUrl, setAudioUrl] = useState("");
	const [albumUrl, setAlbumUrl] = useState("");
	const lyricPlayerRef = useRef<LyricPlayerRef>(null);
	const [lyricLines, setLyricLines] = useState<LyricLine[]>([]);
	const onClickOpenAudio = useCallback(() => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "audio/*";
		input.onchange = () => {
			const file = input.files?.[0];
			if (file) {
				setAudioUrl((old) => {
					if (old.trim().length > 0) {
						URL.revokeObjectURL(old);
					}
					return URL.createObjectURL(file);
				});
			}
		};
		input.click();
	}, []);
	const onClickOpenAlbumImage = useCallback(() => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
		input.onchange = () => {
			const file = input.files?.[0];
			if (file) {
				setAlbumUrl((old) => {
					if (old.trim().length > 0) {
						URL.revokeObjectURL(old);
					}
					return URL.createObjectURL(file);
				});
			}
		};
		input.click();
	}, []);
	const onClickOpenTTMLLyric = useCallback(() => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".ttml,text/*";
		input.onchange = async () => {
			const file = input.files?.[0];
			if (file) {
				const text = await file.text();
				setLyricLines(ttml.parseTTML(text));
			}
		};
		input.click();
	}, []);
	useEffect(() => {
		if (audioRef.current) {
			let lastTime = -1;
			const onFrame = (time: number) => {
				if (audioRef.current && !audioRef.current.paused) {
					if (lastTime === -1) {
						lastTime = time;
					}
					lyricPlayerRef.current?.lyricPlayer?.update(time - lastTime);
					lastTime = time;
					lyricPlayerRef.current?.lyricPlayer?.setCurrentTime(
						(audioRef.current.currentTime * 1000) | 0,
					);
					requestAnimationFrame(onFrame);
				}
			};
			const onPlay = () => onFrame(0);
			audioRef.current.addEventListener("play", onPlay);
			return () => {
				audioRef.current?.removeEventListener("play", onPlay);
			};
		}
	}, [audioRef.current]);
	useEffect(() => {
		// 调试用途，暴露到 Window
		if (lyricPlayerRef.current) {
			// rome-ignore lint/suspicious/noExplicitAny: <explanation>
			(window as any).lyricPlayer = lyricPlayerRef.current;
		}
	}, [lyricPlayerRef.current]);
	return (
		<>
			<BackgroundRender
				style={{
					position: "absolute",
					top: "0",
					left: "0",
					width: "100%",
					height: "100%",
				}}
				albumImageUrl={albumUrl}
			/>
			<LyricPlayer
				style={{
					position: "absolute",
					top: "0",
					left: "0",
					width: "100%",
					height: "100%",
					maxWidth: "100%",
					maxHeight: "100%",
					contain: "paint layout",
					overflow: "hidden",
					mixBlendMode: "plus-lighter",
				}}
				ref={lyricPlayerRef}
				alignAnchor={0.5}
				lyricLines={lyricLines}
			/>
			<div
				style={{
					position: "absolute",
					right: "0",
					bottom: "0",
					backgroundColor: "#0004",
					margin: "1em",
					padding: "1em",
					borderRadius: "0.5em",
					color: "white",
					display: "flex",
					flexDirection: "column",
					gap: "0.5em",
				}}
			>
				<div>AMLL React 绑定调试页面</div>
				<div>为了减少依赖，没有过多的调试设置。</div>
				<div>更加详尽的调试可以直接使用 Core 模块调试。</div>
				<button type="button" onClick={onClickOpenAudio}>
					加载音乐
				</button>
				<button type="button" onClick={onClickOpenAlbumImage}>
					加载专辑图
				</button>
				<button type="button" onClick={onClickOpenTTMLLyric}>
					加载歌词
				</button>
				{/* rome-ignore lint/a11y/useMediaCaption: <explanation> */}
				<audio controls ref={audioRef} src={audioUrl} preload="auto" />
			</div>
		</>
	);
};

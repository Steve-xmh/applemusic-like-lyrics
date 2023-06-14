import * as React from "react";
import { Text } from "@mantine/core";
import {
	useAlbumImage,
	useConfigValue,
	useNowPlayingOpened,
} from "../../api/react";
import { log, warn } from "../../utils/logger";
import { BUILDIN_RENDER_METHODS, CanvasBackgroundRender } from "./render";
import { albumImageMainColorsAtom, musicIdAtom } from "../../core/states";
import { useAtomValue } from "jotai";
import { Pixel } from "../../libs/color-quantize/utils";
import { normalizeColor } from "../../utils/color";
import { BlurAlbumMethod } from "./blur-album";
import { getConfig } from "../../config/core";
import { rgb } from "color-convert/conversions";
import { LyricAlbumImageBackground } from "./components/lyric-album-image-background";
import { LyricAlbumAnimatedImageBackground } from "./components/lyric-album-animated-image-background";

const LyricCanvasBackground: React.FC = () => {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const rendererRef = React.useRef<CanvasBackgroundRender | null>(null);
	const albumImageMainColors = useAtomValue(albumImageMainColorsAtom);
	const backgroundLightness = useConfigValue("backgroundLightness", "1");
	const backgroundRenderScale = useConfigValue("backgroundRenderScale", "1");
	const lyricPageOpened = useNowPlayingOpened();
	const backgroundRenderMethod = useConfigValue(
		"backgroundRenderMethod",
		BlurAlbumMethod.value,
	);
	const backgroundRenderSkipFrames = useConfigValue(
		"backgroundRenderSkipFrames",
		"0",
	);
	const musicId = useAtomValue(musicIdAtom);
	const [albumImageLoaded, albumImage, albumImageUrl] = useAlbumImage(musicId);
	const [canvasError, setCanvasError] = React.useState("");

	const obsRef = React.useRef(
		new ResizeObserver((entries) => {
			const entry = entries[0];
			const renderScale = Math.max(
				0.01,
				Number(getConfig("backgroundRenderScale", "1")) || 1,
			);
			if (entry) {
				const canvas = entry.target as HTMLCanvasElement;
				if (canvas) {
					const renderer = rendererRef.current;
					if (renderer && renderer.canvas === canvas) {
						renderer.resize(
							entry.contentRect.width * renderScale,
							entry.contentRect.height * renderScale,
						);
						renderer.shouldRedraw();
					}
				}
			}
		}),
	);

	React.useEffect(() => {
		let f = Number(backgroundRenderSkipFrames);
		const renderer = rendererRef.current;
		if (renderer) {
			renderer.skipFrameRate = f;
			renderer.shouldRedraw();
		}
	}, [backgroundRenderSkipFrames]);

	React.useEffect(() => {
		const renderer = rendererRef.current;
		const canvas = canvasRef.current;
		if (renderer && canvas && lyricPageOpened) {
			const renderScale = Math.max(0.01, Number(backgroundRenderScale) || 1);
			renderer.resize(
				canvas.clientWidth * renderScale,
				canvas.clientHeight * renderScale,
			);
			renderer.shouldRedraw();
		}
	}, [backgroundRenderScale, lyricPageOpened]);

	React.useEffect(() => {
		const renderer = rendererRef.current;
		if (renderer) {
			const m = BUILDIN_RENDER_METHODS.find(
				(v) => v.value === backgroundRenderMethod,
			);
			if (m) {
				log("已切换背景渲染方式为", backgroundRenderMethod);
				renderer.setRenderMethod(m);
				renderer.shouldRedraw();
			}
		}
	}, [backgroundRenderMethod]);

	React.useEffect(() => {
		setCanvasError("");
		try {
			const canvas = canvasRef.current;
			if (canvas) {
				obsRef.current.observe(canvas);
				const renderer = new CanvasBackgroundRender(canvas);
				const m = BUILDIN_RENDER_METHODS.find(
					(v) => v.value === backgroundRenderMethod,
				);
				if (m) {
					log("已切换背景渲染方式为", backgroundRenderMethod);
					renderer.setRenderMethod(m);
				}
				rendererRef.current = renderer;
				return () => {
					obsRef.current.unobserve(canvas);
					renderer.dispose();
				};
			}
		} catch (err) {
			warn("切换渲染方式发生错误", err);
			setCanvasError(`切换渲染方式发生错误：${err}`);
		}
	}, [canvasRef.current]);

	React.useEffect(() => {
		try {
			const colors = albumImageMainColors
				.slice(0, 4)
				.map<Pixel>(normalizeColor);
			for (let i = 0; i < 4; i++) {
				colors.push(colors[0]);
			}
			let l = Number(backgroundLightness);
			if (Number.isNaN(l)) l = 1;
			l = Math.max(Math.min(2, l), 0);
			colors.sort((a, b) => rgb.hsv(a)[2] - rgb.hsv(b)[2]);
			colors.forEach((c) => {
				if (l > 1) {
					const m = 2 - l;
					c[0] = Math.round(0xff - (0xff - c[0]) * m);
					c[1] = Math.round(0xff - (0xff - c[1]) * m);
					c[2] = Math.round(0xff - (0xff - c[2]) * m);
				} else if (l < 1) {
					c[0] = Math.round(c[0] * l);
					c[1] = Math.round(c[1] * l);
					c[2] = Math.round(c[2] * l);
				}
			});
			const c = [...colors];
			for (let i = 0; i < 28; i++) {
				colors.push(...c);
			}
			const renderer = rendererRef.current;
			if (renderer) {
				renderer.setAlbumColorMap(colors);
				renderer.shouldRedraw();
			} else {
				warn("错误：渲染器对象不存在");
			}
		} catch (err) {
			warn("更新专辑图主要颜色表到渲染管线时发生错误", err);
			setCanvasError(`更新专辑图主要颜色表到渲染管线时发生错误：${err}`);
		}
	}, [albumImageMainColors, backgroundLightness]);

	React.useEffect(() => {
		setCanvasError("");
		let canceled = false;
		(async () => {
			try {
				if (albumImageLoaded && albumImage) {
					try {
						await albumImage.decode();
					} catch (err) {
						warn("图片解码失败，将直接设置", err);
					}
					const renderer = rendererRef.current;
					if (renderer && !canceled) {
						renderer.setAlbumImage(albumImage);
						renderer.shouldRedraw();
					}
				}
			} catch (err) {
				warn("更新专辑图片到渲染管线时发生错误", err);
				setCanvasError(`更新专辑图片到渲染管线时发生错误：${err}`);
			}
		})();
		return () => {
			canceled = true;
		};
	}, [albumImageLoaded, albumImage, albumImageUrl]);

	return (
		<>
			<canvas
				ref={canvasRef}
				className={`am-lyric-background ${backgroundRenderMethod}`}
				style={{
					position: "fixed",
					left: "0",
					top: "0",
					width: "100%",
					height: "100%",
					color: "yellow",
				}}
			/>
			{canvasError.length > 0 && (
				<div
					className="am-lyric-background am-lyric-bg-error"
					style={{
						position: "fixed",
						left: "0",
						top: "0",
						width: "100%",
						height: "100%",
					}}
				>
					<Text>背景渲染发生错误，请检查插件设置中的背景设置</Text>
					<Text>错误信息：</Text>
					<pre>{canvasError}</pre>
				</div>
			)}
		</>
	);
};

const speratedBackgroundMethods = ["blur-album", "blur-animated-album"];

export const LyricBackground: React.FC = () => {
	const backgroundRenderMethod = useConfigValue(
		"backgroundRenderMethod",
		BlurAlbumMethod.value,
	);

	if (speratedBackgroundMethods.includes(backgroundRenderMethod)) {
		switch (backgroundRenderMethod) {
			case "blur-animated-album":
				return <LyricAlbumAnimatedImageBackground />;
			case "blur-album":
			default:
				return <LyricAlbumImageBackground />;
		}
	} else {
		return <LyricCanvasBackground />;
	}
};

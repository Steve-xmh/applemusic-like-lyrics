import * as React from "react";
import { useAlbumImage, useConfigValue } from "../../api/react";
import { warn } from "../../utils/logger";
import { BUILDIN_RENDER_METHODS, CanvasBackgroundRender } from "./render";
import { albumImageMainColorsAtom, musicIdAtom } from "../../core/states";
import { useAtomValue } from "jotai";
import { Pixel } from "../../libs/color-quantize/utils";
import { normalizeColor } from "../../utils/color";
import { BlurAlbumMethod } from "./blur-album";

export const LyricBackground: React.FC = () => {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const renderRef = React.useRef<CanvasBackgroundRender | null>(null);
	const albumImageMainColors = useAtomValue(albumImageMainColorsAtom);
	const backgroundLightness = useConfigValue("backgroundLightness", "1");
	const backgroundRenderScale = useConfigValue("backgroundRenderScale", "1");
	const backgroundRenderMethod = useConfigValue(
		"backgroundRenderMethod",
		BlurAlbumMethod.value,
	);
	const backgroundRenderSkipFrames = useConfigValue(
		"backgroundRenderSkipFrames",
		"0",
	);
	const musicId = useAtomValue(musicIdAtom);
	const [albumImageLoaded, albumImage] = useAlbumImage(musicId);

	const obsRef = React.useRef(
		new ResizeObserver((entries) => {
			const entry = entries[0];
			const renderScale = Math.max(0.01, Number(backgroundRenderScale) || 1);
			if (entry) {
				const canvas = entry.target as HTMLCanvasElement;
				if (canvas) {
					const render = renderRef.current;
					if (render && render.canvas === canvas) {
						render.resize(
							entry.contentRect.width * renderScale,
							entry.contentRect.height * renderScale,
						);
						render.shouldRedraw();
					}
				}
			}
		}),
	);

	React.useEffect(() => {
		let f = Number(backgroundRenderSkipFrames);
		const render = renderRef.current;
		if (render) {
			render.skipFrameRate = f;
			render.shouldRedraw();
		}
	}, [backgroundRenderSkipFrames]);

	React.useEffect(() => {
		const render = renderRef.current;
		const canvas = canvasRef.current;
		if (render && canvas) {
			const renderScale = Math.max(0.01, Number(backgroundRenderScale) || 1);
			render.resize(
				canvas.clientWidth * renderScale,
				canvas.clientHeight * renderScale,
			);
			render.shouldRedraw();
		}
	}, [backgroundRenderScale]);

	React.useEffect(() => {
		const render = renderRef.current;
		if (render) {
			const m = BUILDIN_RENDER_METHODS.find(
				(v) => v.value === backgroundRenderMethod,
			);
			if (m) {
				render.setRenderMethod(m);
				render.shouldRedraw();
			}
		}
	}, [backgroundRenderMethod]);

	React.useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			obsRef.current.observe(canvas);
			const renderer = new CanvasBackgroundRender(canvas);
			renderRef.current = renderer;
			return () => {
				obsRef.current.unobserve(canvas);
				renderer.dispose();
			};
		}
	}, []);

	React.useEffect(() => {
		const colors = albumImageMainColors.slice(0, 2).map<Pixel>(normalizeColor);
		colors.reverse();
		let l = Number(backgroundLightness);
		if (Number.isNaN(l)) l = 1;
		l = Math.max(Math.min(2, l), 0);
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
		for (let i = 0; i < 30; i++) {
			colors.push(...c);
		}
		const render = renderRef.current;
		if (render) {
			render.setAlbumColorMap(colors);
			render.shouldRedraw();
		} else {
			warn("错误：渲染器对象不存在");
		}
	}, [albumImageMainColors, backgroundLightness]);

	React.useEffect(() => {
		if (albumImageLoaded && albumImage) {
			// albumImage.width
		}
	}, [albumImageLoaded, albumImage]);

	return (
		<canvas
			ref={canvasRef}
			className="am-lyric-background"
			style={{
				position: "fixed",
				left: "0",
				top: "0",
				width: "100%",
				height: "100%",
			}}
		/>
	);
};

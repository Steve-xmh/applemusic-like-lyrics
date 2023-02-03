import * as React from "react";
import { useAlbumImage, useConfigValue } from "../../api/react";
import { warn } from "../../utils/logger";
import { CanvasBackgroundRender } from "./render";
import { albumImageMainColorsAtom, musicIdAtom } from "../../core/states";
import { useAtomValue } from "jotai";
import { Pixel } from "../../libs/color-quantize/utils";

export const LyricBackground: React.FC = () => {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const renderRef = React.useRef<CanvasBackgroundRender | null>(null);
	const albumImageMainColors = useAtomValue(albumImageMainColorsAtom);
	const backgroundLightness = useConfigValue("backgroundLightness", "1");
	const musicId = useAtomValue(musicIdAtom);
	const [albumImageLoaded, albumImage] = useAlbumImage(musicId);

	const obsRef = React.useRef(
		new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				const canvas = entry.target as HTMLCanvasElement;
				if (canvas) {
					const render = renderRef.current;
					if (render && render.canvas === canvas) {
						render.resize(
							entry.contentRect.width * 0.1,
							entry.contentRect.height * 0.1,
						);
						render.shouldRedraw();
					}
				}
			}
		}),
	);

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
		const colors = albumImageMainColors.slice(0, 2).map<Pixel>((v) => [...v]);
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
		const mainColor = colors[0];
		for (let i = 0; i < 4; i++) {
			colors.push(mainColor);
		}
		const render = renderRef.current;
		if (render) {
			render.setAlbumColorMap(colors);
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

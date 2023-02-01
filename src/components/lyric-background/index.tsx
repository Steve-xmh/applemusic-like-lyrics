import * as React from "react";
import { useAlbumImageUrl, useConfigValue } from "../../api/react";
import { grabImageColors as workerGrabImageColors } from "../../worker";
import { genBitmapImage } from "../../api";
import { CanvasBackgroundRender } from "./render";
import { log, warn } from "../../utils/logger";

export const LyricBackground: React.FC<{
	musicId: number | string;
}> = (props) => {
	const albumImageUrl = useAlbumImageUrl(props.musicId, 128, 128);
	const backgroundLightness = useConfigValue("backgroundLightness", "1");
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const renderRef = React.useRef<CanvasBackgroundRender | null>(null);

	const obsRef = React.useRef(
		new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				const canvas = entry.target as HTMLCanvasElement;
				if (canvas) {
					const render = renderRef.current;
					if (render && render.canvas === canvas) {
						render.resize(entry.contentRect.width, entry.contentRect.height);
						render.shouldRedraw();
					}
				}
			}
		}),
	);

	React.useEffect(() => {
		const img = new Image();
		let canceled = false;
		img.addEventListener(
			"load",
			() => {
				if (!canceled) {
					log("图片加载完成，正在计算颜色板", albumImageUrl);
					(async () => {
						log("正在生成缩放后的图片");
						const bm = await genBitmapImage(albumImageUrl, 128, 128);
						log("缩放后的图片", bm);
						if (bm) {
							log("正在计算颜色板");
							const colors = await workerGrabImageColors(bm, 2);
							let l = Number(backgroundLightness);
							if (Number.isNaN(l)) {
								l = 1;
							}
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
							const render = renderRef.current;
							log("计算完毕，正在调用渲染器修改颜色板", colors, render);
							if (render) {
								render.setAlbumColorMap(colors);
							} else {
								warn("错误：渲染器对象不存在");
							}
						} else {
							warn("缩放图片失败", albumImageUrl);
						}
					})();
				}
			},
			{
				once: true,
			},
		);
		img.addEventListener("error", (evt) => {
			warn("用于更新背景颜色板的图片", albumImageUrl, "加载失败：", evt.error);
		});
		log("正在加载更新背景颜色板的图片", albumImageUrl);
		img.src = albumImageUrl;
		return () => {
			canceled = true;
		};
	}, [albumImageUrl, backgroundLightness]);

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

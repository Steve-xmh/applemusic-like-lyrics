import { useViewportSize } from "@mantine/hooks";
import * as React from "react";
import { warn } from "./logger";
import { useAlbumImageUrl, useConfig } from "./react-api";
import { grabImageColors as workerGrabImageColors } from "./worker";
import { genBitmapImage as apiGenBitmapImage } from "./api";

function drawImageProp(
	ctx: CanvasRenderingContext2D,
	img: HTMLImageElement | OffscreenCanvas,
	x = 0,
	y = 0,
	w = ctx.canvas.width,
	h = ctx.canvas.height,
	offsetX = 0.5,
	offsetY = 0.5,
) {
	offsetX = typeof offsetX === "number" ? offsetX : 0.5;
	offsetY = typeof offsetY === "number" ? offsetY : 0.5;

	if (offsetX < 0) offsetX = 0;
	if (offsetY < 0) offsetY = 0;
	if (offsetX > 1) offsetX = 1;
	if (offsetY > 1) offsetY = 1;

	var iw = img.width;
	var ih = img.height;
	var r = Math.min(w / iw, h / ih);
	var nw = iw * r;
	var nh = ih * r;
	var cx: number;
	var cy: number;
	var cw: number;
	var ch: number;
	var ar = 1;

	if (nw < w) ar = w / nw;
	if (Math.abs(ar - 1) < 1e-14 && nh < h) ar = h / nh; // updated
	nw *= ar;
	nh *= ar;

	cw = iw / (nw / w);
	ch = ih / (nh / h);

	cx = (iw - cw) * offsetX;
	cy = (ih - ch) * offsetY;

	if (cx < 0) cx = 0;
	if (cy < 0) cy = 0;
	if (cw > iw) cw = iw;
	if (ch > ih) ch = ih;

	// fill image in dest. rectangle
	ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

const defaultRenderFunc = (
	canvas: HTMLCanvasElement,
	albumImage: HTMLImageElement,
	width: number,
	height: number,
	grabImageColors: typeof workerGrabImageColors,
	genBitmapImage: typeof apiGenBitmapImage,
	requestFrame: () => void,
	// rome-ignore lint/suspicious/noExplicitAny: 随便用
	data: { [key: string]: any },
) => {
	const ctx = canvas.getContext("2d");
	if (ctx) {
		if (data.lastImg === undefined) {
			data.lastImg = new Image();
			data.lastImg.src = albumImage.src;
		}
		if (data.i === undefined) {
			data.i = Date.now();
		}
		if (data.img !== albumImage.src) {
			data.i = Date.now();
			data.lastImg.src = data.img;
			data.img = albumImage.src;
		}
		const duration = 500;
		const delta = Date.now() - data.i;
		ctx.save();
		ctx.filter = `blur(${(width / data.lastImg.width) * 16}px)`;
		ctx.globalAlpha = 1;
		try {
			drawImageProp(ctx, data.lastImg);
		} catch {}
		ctx.filter = `blur(${(width / albumImage.width) * 16}px)`;
		ctx.globalAlpha = delta / duration;
		try {
			drawImageProp(ctx, albumImage);
		} catch {}
		ctx.restore();
		ctx.fillStyle = "#00000088";
		ctx.fillRect(0, 0, width, height);
		if (delta <= duration) {
			requestFrame();
		}
	}
};

export const LyricBackground: React.FC<{
	musicId: number | string;
}> = (props) => {
	const albumImageUrl = useAlbumImageUrl(props.musicId);
	const size = useViewportSize();
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const renderDataRef = React.useRef({});
	const albumImage = React.useRef(new Image());
	const [customBackgroundRenderFunc] = useConfig(
		"customBackgroundRenderFunc",
		"",
	);

	const backgroundRenderFunc = React.useMemo(() => {
		renderDataRef.current = {};
		if (customBackgroundRenderFunc.length === 0) return defaultRenderFunc;
		try {
			return new Function(
				"canvas",
				"albumImage",
				"width",
				"height",
				"grabImageColors",
				"requestFrame",
				"data",
				customBackgroundRenderFunc,
			) as unknown as typeof defaultRenderFunc;
		} catch (err) {
			warn("自定义背景函数生成出错", err);
		}
		return defaultRenderFunc;
	}, [customBackgroundRenderFunc]);

	React.useEffect(() => {}, [backgroundRenderFunc]);
	React.useEffect(() => {
		if (albumImageUrl.length > 0) albumImage.current.src = albumImageUrl;
		const width = canvasRef.current?.width || 0;
		const height = canvasRef.current?.height || 0;
		let canceled = false;
		const canvas = canvasRef.current;
		if (canvas) {
			const onDraw = () => {
				if (!canceled)
					backgroundRenderFunc(
						canvas,
						albumImage.current,
						width,
						height,
						workerGrabImageColors,
						apiGenBitmapImage,
						() => requestAnimationFrame(onDraw),
						renderDataRef.current,
					);
			};
			backgroundRenderFunc(
				canvas,
				albumImage.current,
				width,
				height,
				workerGrabImageColors,
				apiGenBitmapImage,
				() => requestAnimationFrame(onDraw),
				renderDataRef.current,
			);
			return () => {
				canceled = true;
			};
		}
	}, [albumImageUrl, size.width, size.height]);

	return (
		<canvas
			ref={canvasRef}
			width={size.width}
			height={size.height}
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

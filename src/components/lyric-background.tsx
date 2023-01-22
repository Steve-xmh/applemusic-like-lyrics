import { useViewportSize } from "@mantine/hooks";
import * as React from "react";
import { log, warn } from "../utils/logger";
import { useAlbumImageUrl, useConfig, useLFPSupported } from "../api/react";
import { grabImageColors as workerGrabImageColors } from "../worker";
import { genBitmapImage as apiGenBitmapImage } from "../api";
import { drawImageProp } from "../utils";
import { GLOBAL_EVENTS } from "../utils/global-events";
import { getConfig } from "../config/core";

interface RenderData {
	i?: number;
	lastImg?: HTMLImageElement;
	img?: string;
}

interface LFPAudioData {
	audio?: HTMLAudioElement;
	audioCtx?: AudioContext;
	audioSource?: MediaElementAudioSourceNode;
	audioAnalyser?: AnalyserNode;
	freqData?: Uint8Array;
	targetbarColor: [number, number, number];
	currentbarColor: [number, number, number];
	gradient?: CanvasGradient;
}

let lfpAudioData: LFPAudioData = {
	audio: undefined,
	audioCtx: undefined,
	audioSource: undefined,
	audioAnalyser: undefined,
	freqData: undefined,
	targetbarColor: [255, 255, 255],
	currentbarColor: [255, 255, 255],
};

const defaultRenderFunc = (
	canvas: HTMLCanvasElement,
	albumImage: HTMLImageElement,
	width: number,
	height: number,
	grabImageColors: typeof workerGrabImageColors,
	genBitmapImage: typeof apiGenBitmapImage,
	requestFrame: () => void,
	data: RenderData,
	lfpAudio?: HTMLAudioElement,
) => {
	const ctx = canvas.getContext("2d");
	let shouldRequestFrame = false;
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
			data.lastImg.src = data.img || "";
			data.img = albumImage.src;
		}
		const duration = 500;
		const delta = Date.now() - data.i;
		ctx.save();
		ctx.filter = "";
		ctx.globalAlpha = 1;
		const lastImgBlurRadius = (width / data.lastImg.width) * 16;
		try {
			drawImageProp(
				ctx,
				data.lastImg,
				-lastImgBlurRadius,
				-lastImgBlurRadius,
				ctx.canvas.width + 2 * lastImgBlurRadius,
				ctx.canvas.height + 2 * lastImgBlurRadius,
			);
		} catch {}
		ctx.filter = `blur(${lastImgBlurRadius}px)`;
		ctx.globalAlpha = 1;
		try {
			drawImageProp(
				ctx,
				data.lastImg,
				-lastImgBlurRadius,
				-lastImgBlurRadius,
				ctx.canvas.width + 2 * lastImgBlurRadius,
				ctx.canvas.height + 2 * lastImgBlurRadius,
			);
		} catch {}
		ctx.filter = "";
		ctx.globalAlpha = delta / duration;
		const albumImageBlurRadius = (width / albumImage.width) * 16;
		try {
			drawImageProp(
				ctx,
				albumImage,
				-albumImageBlurRadius,
				-albumImageBlurRadius,
				ctx.canvas.width + 2 * albumImageBlurRadius,
				ctx.canvas.height + 2 * albumImageBlurRadius,
			);
		} catch {}
		ctx.filter = `blur(${albumImageBlurRadius}px)`;
		ctx.globalAlpha = delta / duration;
		try {
			drawImageProp(
				ctx,
				albumImage,
				-albumImageBlurRadius,
				-albumImageBlurRadius,
				ctx.canvas.width + 2 * albumImageBlurRadius,
				ctx.canvas.height + 2 * albumImageBlurRadius,
			);
		} catch {}
		ctx.restore();
		ctx.fillStyle = "#00000088";
		ctx.fillRect(0, 0, width, height);
		if (getConfig("backgroundAudioVisualizerEffect", "false") === "true") {
			ctx.save();
			if (lfpAudio && lfpAudioData.audio === lfpAudio) {
				if (
					lfpAudioData.audioCtx &&
					lfpAudioData.audioAnalyser &&
					lfpAudioData.audioSource
				) {
					lfpAudioData.freqData ??= new Uint8Array(
						lfpAudioData.audioAnalyser.frequencyBinCount,
					);
					lfpAudioData.audioAnalyser.getByteFrequencyData(
						lfpAudioData.freqData,
					);
					const barWidth = canvas.width / lfpAudioData.freqData.length;
					const border = 4;
					const gradient = ctx.createLinearGradient(
						0,
						canvas.height,
						0,
						(canvas.height / 4) * 3,
					);
					gradient.addColorStop(
						0,
						`rgba(${lfpAudioData.currentbarColor[0]},${lfpAudioData.currentbarColor[1]},${lfpAudioData.currentbarColor[2]},0.1)`,
					);
					gradient.addColorStop(
						0.3,
						`rgba(${lfpAudioData.currentbarColor[0]},${lfpAudioData.currentbarColor[1]},${lfpAudioData.currentbarColor[2]},0.3)`,
					);
					gradient.addColorStop(
						1,
						`rgba(${lfpAudioData.currentbarColor[0]},${lfpAudioData.currentbarColor[1]},${lfpAudioData.currentbarColor[2]},0)`,
					);
					ctx.beginPath();
					lfpAudioData.freqData.forEach((v, i) => {
						let height = ((v / 255) * canvas.height) / 3;
						const x =
							(i / (lfpAudioData.freqData?.length || 1)) * canvas.width +
							barWidth / 2;
						ctx.moveTo(x, canvas.height);
						ctx.lineTo(x, canvas.height - height);
					});
					ctx.strokeStyle = gradient;
					ctx.lineCap = "round";
					ctx.lineJoin = "round";
					ctx.lineWidth = barWidth / 4;
					ctx.shadowColor = `rgba(${lfpAudioData.currentbarColor[0]},${lfpAudioData.currentbarColor[1]},${lfpAudioData.currentbarColor[2]},1)`;
					ctx.shadowBlur = barWidth;
					ctx.stroke();
				} else {
					log("已创建 AudioContext");
					lfpAudioData.audioAnalyser?.disconnect();
					lfpAudioData.audioSource?.disconnect();
					lfpAudioData.audioCtx ??= new AudioContext();
					const analyser = lfpAudioData.audioCtx.createAnalyser();
					analyser.fftSize = 128;
					const source =
						lfpAudioData.audioCtx.createMediaElementSource(lfpAudio);
					source.connect(analyser);
					analyser.connect(lfpAudioData.audioCtx.destination);
					lfpAudioData.audioSource = source;
					lfpAudioData.audioAnalyser = analyser;
				}
				shouldRequestFrame ||= true;
			} else if (lfpAudio) {
				if (lfpAudioData.audio !== lfpAudio) {
					log("已销毁上一个 AudioContext");
					lfpAudioData.audioCtx?.close();
					lfpAudioData.audioAnalyser?.disconnect();
					lfpAudioData.audioSource?.disconnect();
					lfpAudioData.audioCtx = undefined;
					lfpAudioData.audioAnalyser = undefined;
					lfpAudioData.audio = lfpAudio;
					log("已交换 Audio", lfpAudio);
				}
				shouldRequestFrame ||= !!lfpAudio;
			}
			ctx.restore();
		}
		if (delta <= duration) {
			shouldRequestFrame ||= true;
		}
	}
	if (shouldRequestFrame) requestFrame();
};

export const LyricBackground: React.FC<{
	musicId: number | string;
}> = (props) => {
	const albumImageUrl = useAlbumImageUrl(props.musicId);
	const size = useViewportSize();
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const renderDataRef = React.useRef<RenderData>({});
	const albumImage = React.useRef(new Image());
	const [isLFPSupported, isLFPEnabled] = useLFPSupported();
	const [customBackgroundRenderFunc] = useConfig(
		"customBackgroundRenderFunc",
		"",
	);

	const backgroundRenderFunc = React.useMemo(() => {
		renderDataRef.current.audioAnalyser?.disconnect();
		renderDataRef.current.audioSource?.disconnect();
		renderDataRef.current.audioCtx?.close();
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
		let lfpAudio: HTMLAudioElement | undefined = undefined;
		const onAudioUpdated = () => {
			lfpAudio = loadedPlugins.LibFrontendPlay?.currentAudioPlayer;
		};
		if (isLFPSupported && isLFPEnabled) {
			GLOBAL_EVENTS.addEventListener("lfp-audio-updated", onAudioUpdated);
			lfpAudio = loadedPlugins.LibFrontendPlay?.currentAudioPlayer;
		}
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
						lfpAudio,
					);
			};
			requestAnimationFrame(onDraw);
			return () => {
				canceled = true;
				GLOBAL_EVENTS.removeEventListener("lfp-audio-updated", onAudioUpdated);
			};
		}
	}, [albumImageUrl, size.width, size.height, isLFPSupported, isLFPEnabled]);

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

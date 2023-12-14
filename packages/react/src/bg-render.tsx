import {
	BackgroundRender as CoreBackgroundRender,
	AbstractBaseRenderer,
	BaseRenderer,
	PixiRenderer,
} from "@applemusic-like-lyrics/core";
import {
	useRef,
	useEffect,
	forwardRef,
	useImperativeHandle,
	type HTMLProps,
} from "react";

/**
 * 背景渲染组件的属性
 */
export interface BackgroundRenderProps {
	/**
	 * 设置背景专辑图片
	 */
	albumImageUrl?: string;
	/**
	 * 设置当前背景动画帧率，如果为 `undefined` 则默认为 `30`
	 */
	fps?: number;
	/**
	 * 设置当前播放状态，如果为 `undefined` 则默认为 `true`
	 */
	playing?: boolean;
	/**
	 * 设置当前动画流动速度，如果为 `undefined` 则默认为 `2`
	 */
	flowSpeed?: number;
	/**
	 * 设置当前渲染缩放比例，如果为 `undefined` 则默认为 `0.5`
	 */
	renderScale?: number;
	/**
	 * 是否启用静态模式，即图片在更换后就会保持静止状态并禁用更新，以节省性能
	 * 默认为 `false`
	 */
	staticMode?: boolean;
	/**
	 * 设置渲染器，如果为 `undefined` 则默认为 `PixiRenderer`
	 * 默认渲染器有可能会随着版本更新而更换
	 */
	renderer?: { new (canvas: HTMLCanvasElement): BaseRenderer };
}

/**
 * 背景渲染组件的引用
 */
export interface BackgroundRenderRef {
	/**
	 * 背景渲染实例引用
	 */
	bgRender?: AbstractBaseRenderer;
	/**
	 * 将背景渲染实例的元素包裹起来的 DIV 元素实例
	 */
	wrapperEl: HTMLDivElement | null;
}

/**
 * 流体背景渲染组件，通过提供图片链接可以显示出酷似 Apple Music 的流体背景效果
 */
export const BackgroundRender = forwardRef<
	BackgroundRenderRef,
	HTMLProps<HTMLDivElement> & BackgroundRenderProps
>(
	(
		{
			albumImageUrl,
			fps,
			playing,
			flowSpeed,
			renderScale,
			staticMode,
			renderer,
			...props
		},
		ref,
	) => {
		const coreBGRenderRef = useRef<AbstractBaseRenderer>();
		const wrapperRef = useRef<HTMLDivElement>(null);

		useEffect(() => {
			coreBGRenderRef.current = CoreBackgroundRender.new(
				renderer ?? PixiRenderer,
			);
			if (albumImageUrl) coreBGRenderRef.current?.setAlbumImage(albumImageUrl);
			if (fps) coreBGRenderRef.current?.setFPS(fps);
			if (playing === undefined) {
				coreBGRenderRef.current?.resume();
			} else if (playing) {
				coreBGRenderRef.current?.resume();
			} else {
				coreBGRenderRef.current?.pause();
			}
			if (flowSpeed) coreBGRenderRef.current?.setFlowSpeed(flowSpeed);
			coreBGRenderRef.current?.setStaticMode(staticMode ?? false);
			if (renderScale)
				coreBGRenderRef.current?.setRenderScale(renderScale ?? 0.5);
			return () => {
				coreBGRenderRef.current?.dispose();
			};
		}, [renderer]);

		useEffect(() => {
			if (albumImageUrl) coreBGRenderRef.current?.setAlbumImage(albumImageUrl);
		}, [albumImageUrl]);

		useEffect(() => {
			if (fps) coreBGRenderRef.current?.setFPS(fps);
		}, [fps]);

		useEffect(() => {
			if (playing === undefined) {
				coreBGRenderRef.current?.resume();
			} else if (playing) {
				coreBGRenderRef.current?.resume();
			} else {
				coreBGRenderRef.current?.pause();
			}
		}, [playing]);

		useEffect(() => {
			if (flowSpeed) coreBGRenderRef.current?.setFlowSpeed(flowSpeed);
		}, [flowSpeed]);

		useEffect(() => {
			coreBGRenderRef.current?.setStaticMode(staticMode ?? false);
		}, [staticMode]);

		useEffect(() => {
			if (renderScale)
				coreBGRenderRef.current?.setRenderScale(renderScale ?? 0.5);
		}, [renderScale]);

		useEffect(() => {
			if (coreBGRenderRef.current) {
				const el = coreBGRenderRef.current.getElement();
				el.style.width = "100%";
				el.style.height = "100%";
				wrapperRef.current?.appendChild(el);
			}
		}, [coreBGRenderRef.current]);

		useImperativeHandle(
			ref,
			() => ({
				wrapperEl: wrapperRef.current,
				bgRender: coreBGRenderRef.current,
			}),
			[wrapperRef.current, coreBGRenderRef.current],
		);

		return <div {...props} ref={wrapperRef} />;
	},
);

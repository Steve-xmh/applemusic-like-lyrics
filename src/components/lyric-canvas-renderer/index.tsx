import { useAtomValue } from "jotai";
import * as React from "react";
import { currentLyricsAtom, currentLyricsIndexAtom } from "../../core/states";
import { CanvasLyricRender } from "./render";

export const LyricCanvasRenderer: React.FC = () => {
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const renderRef = React.useRef<CanvasLyricRender | null>(null);
	const obsRef = React.useRef(
		new ResizeObserver((entries) => {
			const entry = entries[0];
			if (entry) {
				const canvas = entry.target as HTMLCanvasElement;
				if (canvas) {
					canvas.width = entry.contentRect.width * window.devicePixelRatio;
					canvas.height = entry.contentRect.height * window.devicePixelRatio;
					const render = renderRef.current;
					if (render && render.canvas === canvas) {
						render.updateLayout();
						render.shouldRedraw();
					}
				}
			}
		}),
	);
	const currentLyrics = useAtomValue(currentLyricsAtom);
	const currentLyricIndex = useAtomValue(currentLyricsIndexAtom);

	React.useLayoutEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) {
			obsRef.current.observe(canvas);
			const renderer = new CanvasLyricRender(canvas);
			if (currentLyrics) renderer.setLyric(currentLyrics);
			renderRef.current = renderer;
			return () => {
				obsRef.current.unobserve(canvas);
				renderer.dispose();
			};
		}
	}, []);

	React.useLayoutEffect(() => {
		const renderer = renderRef.current;
		if (renderer) {
			if (currentLyrics) renderer.setLyric(currentLyrics);
			else renderer.setLyric([]);
		}
	}, [currentLyrics]);

	React.useLayoutEffect(() => {
		const renderer = renderRef.current;
		if (renderer) {
			if (currentLyrics) renderer.setCurrentLyricIndex(currentLyricIndex);
		}
	}, [currentLyricIndex]);

	return (
		<canvas
			style={{ width: "100%", height: "100%", flex: "1", font: "unset" }}
			ref={canvasRef}
		/>
	);
};

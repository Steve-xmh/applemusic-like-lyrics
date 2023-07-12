import * as React from "react";
import { useAlbumImage, useNowPlayingOpened } from "../../api/react";
import { musicIdAtom, playStateAtom } from "../../core/states";
import { useAtomValue } from "jotai";
import { PixiRenderer } from "./pixi-renderer";
import { PlayState } from "../../api";

const LyricPixiBackground: React.FC = () => {
	const musicId = useAtomValue(musicIdAtom);
	const playState = useAtomValue(playStateAtom);
	const lyricPageOpened = useNowPlayingOpened();
	const [albumImageLoaded, , albumImageUrl] = useAlbumImage(musicId);
	const canvasRef = React.useRef<HTMLCanvasElement>(null);
	const rendererRef = React.useRef<PixiRenderer | undefined>(undefined);
	React.useLayoutEffect(() => {
		if (rendererRef.current) {
			rendererRef.current.dispose();
		}
		if (canvasRef.current) {
			rendererRef.current = new PixiRenderer(canvasRef.current);
		}
	}, [canvasRef.current]);
	React.useEffect(() => {
		if (rendererRef.current && albumImageLoaded) {
			rendererRef.current.updateAlbum(albumImageUrl);
		}
	}, [albumImageUrl, albumImageLoaded]);
	React.useEffect(() => {
		if (playState === PlayState.Playing && lyricPageOpened) {
			rendererRef.current?.resume();
		} else {
			rendererRef.current?.pause();
		}
	}, [playState, lyricPageOpened]);
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
				color: "yellow",
				display: "block",
				zIndex: -1,
			}}
		/>
	);
};

export const LyricBackground: React.FC = () => {
	return <LyricPixiBackground />;
};

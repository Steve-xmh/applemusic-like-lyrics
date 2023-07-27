import type { FC } from "react";
import {
	BackgroundRender,
	LyricPlayer as LyricPlayerComponent,
} from "@applemusic-like-lyrics/react";
import { closeLyricPage } from "../injector";

export const LyricPlayer: FC = (props) => {
	return (
		<>
			<BackgroundRender
				style={{
					position: "absolute",
					width: "100%",
					height: "100%",
					pointerEvents: "none",
				}}
			/>
			<div className="lyric-player">
				<button
					style={{
						gridColumn: "1",
						gridRow: "2",
					}}
					type="button"
					onClick={() => {
						closeLyricPage();
					}}
				>
					Back button
				</button>
				<img
					style={{
						aspectRatio: "1/1",
						gridColumn: "1",
						gridRow: "3",
						alignSelf: "center",
						justifySelf: "center",
						width: "min(50vh,40vw)",
						height: "min(50vh,40vw)",
					}}
					alt="歌曲封面图"
				/>
				<div
					style={{
						gridColumn: "1",
						gridRow: "4",
					}}
				>
					Controls
				</div>
				<LyricPlayerComponent
					style={{
						gridColumn: "2",
						gridRow: "1 / 6",
						width: "100%",
						height: "100%",
					}}
				/>
				<div
					style={{
						height: "50px",
						gridColumn: "1 / 3",
						gridRow: "1",
						zIndex: "1"
					}}
					onMouseDown={(evt) => {
						evt.preventDefault();
						evt.stopPropagation();
						channel.call("winhelper.dragWindow", () => {}, []);
					}}
				/>
			</div>
		</>
	);
};

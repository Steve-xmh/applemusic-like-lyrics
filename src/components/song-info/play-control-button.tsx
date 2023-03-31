import { useAtom } from "jotai";
import { currentPlayModeAtom } from "../../core/states";
import { PlayMode, switchPlayMode } from "../../utils";
import * as React from "react";

import IconShuffle from "../../assets/icon_shuffle.svg";
import IconShuffleOn from "../../assets/icon_shuffle_on.svg";
import IconRepeat from "../../assets/icon_repeat.svg";
import IconRepeatOn from "../../assets/icon_repeat_on.svg";
import IconRepeatAI from "../../assets/icon_ai.svg";
import IconRepeatAIOn from "../../assets/icon_ai_on.svg";
import IconRepeatOne from "../../assets/icon_repeatone.svg";
import IconRepeatOneOn from "../../assets/icon_repeatone_on.svg";
import IconFavorite from "../../assets/icon_favorite.svg";
import IconFavoriteOn from "../../assets/icon_favorite_on.svg";
import IconAddToPlaylist from "../../assets/icon_add_to_playlist.svg";

export enum PlayControlButtonType {
	PlaybackOrder = "playback-type-order",
	PlaybackRepeat = "playback-type-loop",
	PlaybackOne = "playback-type-one",
	PlaybackRandom = "playback-type-random",
	PlaybackAI = "playback-type-ai",
	AddToPlaylist = "add-to-playlist",
	AddToFav = "add-to-fav",
}

export const PlayControlButton: React.FC<{
	type: PlayControlButtonType;
}> = (props) => {
	const [currentPlayMode, setCurrentPlayMode] = useAtom(currentPlayModeAtom);
	const [isFavSong, setIsFavSong] = React.useState(
		() =>
			!!document
				.querySelector<HTMLDivElement>(".m-pinfo .btn.btn-love")
				?.classList.contains("loved"),
	);

	React.useLayoutEffect(() => {
		if (props.type === PlayControlButtonType.AddToFav) {
			const pinfo = document.querySelector<HTMLDivElement>(".m-pinfo>*");
			if (pinfo) {
				const obz = new MutationObserver(() => {
					setIsFavSong(
						!!document
							.querySelector<HTMLDivElement>(".m-pinfo .btn.btn-love")
							?.classList.contains("loved"),
					);
				});
				obz.observe(pinfo, {
					childList: true,
				});
				return () => {
					obz.disconnect();
				};
			}
		}
	}, [props.type]);

	switch (props.type) {
		case PlayControlButtonType.PlaybackOrder:
			return (
				<button
					className="am-music-track-btn"
					onClick={() => {
						if (currentPlayMode === PlayMode.Order) {
							switchPlayMode(PlayMode.Order);
							setCurrentPlayMode(PlayMode.Order);
						} else {
							switchPlayMode(PlayMode.Order);
							setCurrentPlayMode(PlayMode.Order);
						}
					}}
				>
					{currentPlayMode === PlayMode.Order ? (
						<IconRepeatOn color="#FFFFFF" />
					) : (
						<IconRepeat color="#FFFFFF" />
					)}
				</button>
			);
		case PlayControlButtonType.PlaybackRepeat:
			return (
				<button
					className="am-music-track-btn"
					onClick={() => {
						if (currentPlayMode === PlayMode.Repeat) {
							switchPlayMode(PlayMode.Order);
							setCurrentPlayMode(PlayMode.Order);
						} else {
							switchPlayMode(PlayMode.Repeat);
							setCurrentPlayMode(PlayMode.Repeat);
						}
					}}
				>
					{currentPlayMode === PlayMode.Repeat ? (
						<IconRepeatOn color="#FFFFFF" />
					) : (
						<IconRepeat color="#FFFFFF" />
					)}
				</button>
			);
		case PlayControlButtonType.PlaybackOne:
			return (
				<button
					className="am-music-track-btn"
					onClick={() => {
						if (currentPlayMode === PlayMode.One) {
							switchPlayMode(PlayMode.Order);
							setCurrentPlayMode(PlayMode.Order);
						} else {
							switchPlayMode(PlayMode.One);
							setCurrentPlayMode(PlayMode.One);
						}
					}}
				>
					{currentPlayMode === PlayMode.One ? (
						<IconRepeatOneOn color="#FFFFFF" />
					) : (
						<IconRepeatOne color="#FFFFFF" />
					)}
				</button>
			);
		case PlayControlButtonType.PlaybackRandom:
			return (
				<button
					className="am-music-track-btn"
					onClick={() => {
						if (currentPlayMode === PlayMode.Random) {
							switchPlayMode(PlayMode.Order);
							setCurrentPlayMode(PlayMode.Order);
						} else {
							switchPlayMode(PlayMode.Random);
							setCurrentPlayMode(PlayMode.Random);
						}
					}}
				>
					{currentPlayMode === PlayMode.Random ? (
						<IconShuffleOn color="#FFFFFF" />
					) : (
						<IconShuffle color="#FFFFFF" />
					)}
				</button>
			);
		case PlayControlButtonType.PlaybackAI:
			return (
				<button
					className="am-music-track-btn"
					onClick={() => {
						if (currentPlayMode === PlayMode.AI) {
							switchPlayMode(PlayMode.Order);
							setCurrentPlayMode(PlayMode.Order);
						} else {
							switchPlayMode(PlayMode.AI);
							setCurrentPlayMode(PlayMode.AI);
						}
					}}
				>
					{currentPlayMode === PlayMode.AI ? (
						<IconRepeatAIOn color="#FFFFFF" />
					) : (
						<IconRepeatAI color="#FFFFFF" />
					)}
				</button>
			);
		case PlayControlButtonType.AddToPlaylist:
			return (
				<button
					className="am-music-track-btn"
					onClick={() => {
						document
							.querySelector<HTMLDivElement>(".m-pinfo .btn.btn-fav")
							?.click();
					}}
				>
					<IconAddToPlaylist color="#FFFFFF" />
				</button>
			);
		case PlayControlButtonType.AddToFav:
			return (
				<button
					className="am-music-track-btn"
					onClick={() => {
						document
							.querySelector<HTMLDivElement>(".m-pinfo .btn.btn-love")
							?.click();
					}}
				>
					{isFavSong ? (
						<IconFavoriteOn color="#FFFFFF" />
					) : (
						<IconFavorite color="#FFFFFF" />
					)}
				</button>
			);
		default:
			throw new TypeError(`未知的控制按钮类型：${props.type}`);
	}
};

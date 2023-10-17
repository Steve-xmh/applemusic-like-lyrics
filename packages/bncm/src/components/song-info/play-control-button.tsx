import { useAtom } from "jotai";
import * as React from "react";

import IconShuffle from "../../assets/icon_shuffle.svg?react";
import IconShuffleOn from "../../assets/icon_shuffle_on.svg?react";
import IconRepeat from "../../assets/icon_repeat.svg?react";
import IconRepeatOn from "../../assets/icon_repeat_on.svg?react";
import IconRepeatAI from "../../assets/icon_ai.svg?react";
import IconRepeatAIOn from "../../assets/icon_ai_on.svg?react";
import IconRepeatOne from "../../assets/icon_repeatone.svg?react";
import IconRepeatOneOn from "../../assets/icon_repeatone_on.svg?react";
import IconOrder from "../../assets/icon_order.svg?react";
import IconOrderOn from "../../assets/icon_order_on.svg?react";
import IconFavorite from "../../assets/icon_favorite.svg?react";
import IconFavoriteOn from "../../assets/icon_favorite_on.svg?react";
import IconFavoriteHeart from "../../assets/icon_favorite_heart.svg?react";
import IconFavoriteHeartOn from "../../assets/icon_favorite_heart_on.svg?react";
import IconAddToPlaylist from "../../assets/icon_add_to_playlist.svg?react";
import { playModeAtom } from "../../music-context/wrapper";
import { PlayMode } from "../../music-context";
import { isNCMV3 } from "../../utils/is-ncm-v3";

export enum PlayControlButtonType {
	PlaybackSwitcher = "playback-switcher",
	PlaybackSwitcherFilled = "playback-switcher-filled",
	PlaybackOrder = "playback-type-order",
	PlaybackRepeat = "playback-type-loop",
	PlaybackOne = "playback-type-one",
	PlaybackRandom = "playback-type-random",
	PlaybackAI = "playback-type-ai",
	AddToPlaylist = "add-to-playlist",
	AddToFav = "add-to-fav",
	AddToFavHeart = "add-to-fav-heart",
}

const getPlaybackModeIcon = (playMode: PlayMode, filled = false) => {
	switch (playMode) {
		case PlayMode.Order:
			return filled ? (
				<IconOrderOn color="#FFFFFF" />
			) : (
				<IconOrder color="#FFFFFF" />
			);
		case PlayMode.Repeat:
			return filled ? (
				<IconRepeatOn color="#FFFFFF" />
			) : (
				<IconRepeat color="#FFFFFF" />
			);
		case PlayMode.AI:
			return filled ? (
				<IconRepeatAIOn color="#FFFFFF" />
			) : (
				<IconRepeatAI color="#FFFFFF" />
			);
		case PlayMode.One:
			return filled ? (
				<IconRepeatOneOn color="#FFFFFF" />
			) : (
				<IconRepeatOne color="#FFFFFF" />
			);
		case PlayMode.Random:
			return filled ? (
				<IconShuffleOn color="#FFFFFF" />
			) : (
				<IconShuffle color="#FFFFFF" />
			);
		default:
			throw new TypeError(`未知的播放类型：${playMode}`);
	}
};

const PlaybackSwitcherButton: React.FC<{
	filled?: boolean;
}> = (props) => {
	const [currentPlayMode, setCurrentPlayMode] = useAtom(playModeAtom);
	return (
		<button
			className="am-music-track-btn"
			onClick={() => {
				let nextPlayMode: PlayMode;

				switch (currentPlayMode) {
					case PlayMode.Order:
						nextPlayMode = PlayMode.Repeat;
						break;
					case PlayMode.Repeat:
						// 只有处于 我喜欢的音乐 歌单中才可以使用心动模式

						// if (getPlayingSong().originFromTrack.userId === "") {
						// 	nextPlayMode = PlayMode.One;
						// } else {
						nextPlayMode = PlayMode.AI;
						// }
						break;
					case PlayMode.AI:
						nextPlayMode = PlayMode.One;
						break;
					case PlayMode.One:
						nextPlayMode = PlayMode.Random;
						break;
					case PlayMode.Random:
						nextPlayMode = PlayMode.Order;
						break;
					default:
						throw new TypeError(`未知的播放类型：${currentPlayMode}`);
				}

				setCurrentPlayMode(nextPlayMode);
			}}
		>
			{getPlaybackModeIcon(currentPlayMode, props.filled)}
		</button>
	);
};

export const PlayControlButton: React.FC<{
	type: PlayControlButtonType;
}> = (props) => {
	const [currentPlayMode, setCurrentPlayMode] = useAtom(playModeAtom);
	const [isFavSong, setIsFavSong] = React.useState(
		() =>
			!!document
				.querySelector<HTMLDivElement>(".m-pinfo .btn.btn-love")
				?.classList.contains("loved"),
	);

	React.useLayoutEffect(() => {
		if (
			props.type === PlayControlButtonType.AddToFav ||
			props.type === PlayControlButtonType.AddToFavHeart
		) {
			if (isNCMV3()) {
				const btnSpan = document.querySelector<HTMLSpanElement>(
					"footer .left button:nth-child(1) > span > span",
				);
				if (btnSpan) {
					const obz = new MutationObserver(() => {
						setIsFavSong(btnSpan.title.startsWith("喜欢"));
					});
					obz.observe(btnSpan, {
						attributes: true,
						attributeFilter: ["title"],
					});
					return () => {
						obz.disconnect();
					};
				}
			} else {
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
		}
	}, [props.type]);

	switch (props.type) {
		case PlayControlButtonType.PlaybackOrder:
			return (
				<button
					className="am-music-track-btn"
					onClick={() => {
						if (currentPlayMode === PlayMode.Order) {
							setCurrentPlayMode(PlayMode.Order);
						} else {
							setCurrentPlayMode(PlayMode.Order);
						}
					}}
				>
					{currentPlayMode === PlayMode.Order ? (
						<IconOrderOn color="#FFFFFF" />
					) : (
						<IconOrder color="#FFFFFF" />
					)}
				</button>
			);
		case PlayControlButtonType.PlaybackRepeat:
			return (
				<button
					className="am-music-track-btn"
					onClick={() => {
						if (currentPlayMode === PlayMode.Repeat) {
							setCurrentPlayMode(PlayMode.Order);
						} else {
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
							setCurrentPlayMode(PlayMode.Order);
						} else {
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
							setCurrentPlayMode(PlayMode.Order);
						} else {
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
							setCurrentPlayMode(PlayMode.Order);
						} else {
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
							.querySelector<HTMLButtonElement>(
								"footer .left button:nth-child(1)",
							)
							?.click();
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
		case PlayControlButtonType.AddToFavHeart:
			return (
				<button
					className="am-music-track-btn"
					onClick={() => {
						document
							.querySelector<HTMLButtonElement>(
								"footer .left button:nth-child(1)",
							)
							?.click();
						document
							.querySelector<HTMLDivElement>(".m-pinfo .btn.btn-love")
							?.click();
					}}
				>
					{isFavSong ? (
						<IconFavoriteHeartOn color="#FFFFFF" />
					) : (
						<IconFavoriteHeart color="#FFFFFF" />
					)}
				</button>
			);
		case PlayControlButtonType.PlaybackSwitcher:
			return <PlaybackSwitcherButton />;
		case PlayControlButtonType.PlaybackSwitcherFilled:
			return <PlaybackSwitcherButton filled />;
		default:
			throw new TypeError(`未知的控制按钮类型：${props.type}`);
	}
};

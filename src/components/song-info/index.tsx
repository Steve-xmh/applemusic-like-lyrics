import { Loader, LoadingOverlay } from "@mantine/core";
import { IconDots, IconVolume, IconVolume2 } from "@tabler/icons";
import { useAtomValue, useSetAtom } from "jotai";
import * as React from "react";
import { AudioQualityType, genAudioPlayerCommand } from "../../api";
import {
	useAlbumImageUrl,
	useConfigValue,
	useConfigValueBoolean,
} from "../../api/react";
import {
	musicIdAtom,
	songArtistsAtom,
	songNameAtom,
	playProgressAtom,
	currentAudioDurationAtom,
	playVolumeAtom,
	currentAudioQualityTypeAtom,
	currentAudioIdAtom,
	topbarMenuOpenedAtom,
	albumAtom,
} from "../../core/states";
import { LyricPlayerFMControls } from "../lyric-player-fm-controls";

import IconLossless from "../../assets/icon_lossless.svg";
import IconDolbyAtmos from "../../assets/icon_dolby_atmos.svg";
import { AudioFFTControl } from "./audio-fft-control";
import { PlayControls } from "./play-controls";

function toDuration(duration: number) {
	const isRemainTime = duration < 0;

	const d = Math.abs(duration | 0);
	const sec = d % 60;
	const min = Math.floor((d - sec) / 60);
	const secText = "0".repeat(2 - sec.toString().length) + sec;

	return `${isRemainTime ? "-" : ""}${min}:${secText}`;
}

export const PlayerSongInfo: React.FC<{
	isFM?: boolean;
}> = (props) => {
	const currentAudioQualityType = useAtomValue(currentAudioQualityTypeAtom);
	const currentAudioId = useAtomValue(currentAudioIdAtom);
	const musicId = useAtomValue(musicIdAtom);
	const songName: string = useAtomValue(songNameAtom);
	const album = useAtomValue(albumAtom);
	const songArtists = useAtomValue(songArtistsAtom);
	const currentAudioDuration = useAtomValue(currentAudioDurationAtom) / 1000;
	const playProgress = useAtomValue(playProgressAtom);
	const playVolume = useAtomValue(playVolumeAtom);
	const albumImageUrl = useAlbumImageUrl(musicId, 64, 64);
	const setMenuOpened = useSetAtom(topbarMenuOpenedAtom);

	const hideAlbumImage = useConfigValueBoolean("hideAlbumImage", false);
	const hideMusicName = useConfigValueBoolean("hideMusicName", false);
	const hideMusicArtists = useConfigValueBoolean("hideMusicArtists", false);
	const hideMusicAlbum = useConfigValueBoolean("hideMusicAlbum", false);
	const hideMenuButton = useConfigValueBoolean("hideMenuButton", false);
	const hidePlayProgressBar = useConfigValueBoolean(
		"hidePlayProgressBar",
		false,
	);
	const hideAudioQualityTag = useConfigValueBoolean(
		"hideAudioQualityTag",
		false,
	);

	const widgetUnderProgressBar = useConfigValue(
		"widgetUnderProgressBar",
		"play-controls",
	);

	const playProgressText = toDuration(playProgress);
	const remainText = toDuration(playProgress - currentAudioDuration);

	return (
		<>
			{!(hideAlbumImage && hideMusicName && hideMusicArtists) && (
				<div
					className="am-player-song-info"
					onContextMenu={(evt) => {
						setMenuOpened(true);
						evt.preventDefault();
					}}
				>
					<div className="am-music-info-spacer" />
					{!hideAlbumImage && (
						<div className="am-album-image">
							<div>
								<LoadingOverlay
									loader={
										<Loader
											size={50}
											style={{
												width: "50px",
												height: "50px",
											}}
										/>
									}
									sx={{
										borderRadius: "3%",
									}}
									visible={albumImageUrl.length === 0}
								/>
								<img
									alt="专辑图片"
									src={albumImageUrl}
									style={{
										opacity: albumImageUrl.length > 0 ? 1 : 0,
									}}
								/>
							</div>
						</div>
					)}
					<div className="am-music-sub-widget">
						{!hideAudioQualityTag && (
							<div className="am-music-quality">
								{currentAudioQualityType === AudioQualityType.Lossless && (
									<div className="am-music-quality-tag">
										<IconLossless />
										无损
									</div>
								)}
								{currentAudioQualityType === AudioQualityType.HiRes && (
									<div className="am-music-quality-tag">
										<IconLossless />
										高解析度无损
									</div>
								)}
								{currentAudioQualityType === AudioQualityType.DolbyAtmos && (
									<div>
										<IconDolbyAtmos />
									</div>
								)}
							</div>
						)}
						<div className="am-music-info-with-menu">
							<div className="am-music-info">
								{!hideMusicName &&
									(hideMusicAlbum || songName !== album.name) && (
										<div className="am-music-name">{songName}</div>
									)}
								{!hideMusicAlbum && (
									<div className="am-music-album">
										<a href={`#/m/album/?id=${album.id}`}>{album.name}</a>
									</div>
								)}
								{!hideMusicArtists && (
									<div className="am-music-artists">
										<div className="am-artists">
											{songArtists.map((artist, index) => (
												<a
													href={`#/m/artist/?id=${artist.id}`}
													key={`${artist.id}-${artist.name}-${index}`}
												>
													{artist.name}
												</a>
											))}
										</div>
									</div>
								)}
							</div>
							{!hideMenuButton && (
								<button
									className="am-music-main-menu"
									onClick={() => setMenuOpened(true)}
								>
									<IconDots color="#FFFFFF" />
								</button>
							)}
						</div>

						{!hidePlayProgressBar && (
							<div className="am-music-progress-control">
								{/* rome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
								<div
									className="am-music-progress-bar"
									onClick={(evt) => {
										const rect = evt.currentTarget.getBoundingClientRect();
										const pos = (evt.clientX - rect.left) / rect.width;
										legacyNativeCmder._envAdapter.callAdapter(
											"audioplayer.seek",
											() => {},
											[
												currentAudioId,
												genAudioPlayerCommand(currentAudioId, "seek"),
												pos * currentAudioDuration,
											],
										);
									}}
								>
									<div
										style={{
											width: `${(playProgress / currentAudioDuration) * 100}%`,
										}}
									/>
								</div>
								<div className="am-music-progress-tips">
									<div>{playProgressText}</div>
									<div>{remainText}</div>
								</div>
							</div>
						)}
					</div>

					{widgetUnderProgressBar === "play-controls" && props.isFM && (
						<LyricPlayerFMControls />
					)}
					{widgetUnderProgressBar === "play-controls" && !props.isFM && (
						<PlayControls />
					)}

					{widgetUnderProgressBar === "play-controls" && (
						<div className="am-music-volume-controls">
							<IconVolume2 color="#FFFFFF" />
							{/* rome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
							<div
								className="am-music-volume-bar"
								onClick={(evt) => {
									const rect = evt.currentTarget.getBoundingClientRect();
									const pos = (evt.clientX - rect.left) / rect.width;
									legacyNativeCmder._envAdapter.callAdapter(
										"audioplayer.setVolume",
										() => {},
										["", "", pos],
									);
								}}
							>
								<div style={{ width: `${playVolume * 100}%` }} />
							</div>
							<IconVolume color="#FFFFFF" />
						</div>
					)}

					{widgetUnderProgressBar === "audio-viz-fft" && <AudioFFTControl />}

					<div className="am-music-info-bottom-spacer" />
				</div>
			)}
		</>
	);
};

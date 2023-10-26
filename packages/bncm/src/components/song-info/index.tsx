import { useAtom, useAtomValue, useSetAtom } from "jotai";
import * as React from "react";
import { genAudioPlayerCommand } from "../../api";
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
	currentAudioIdAtom,
	topbarMenuOpenedAtom,
	albumAtom,
} from "../../core/states";
import { LyricPlayerFMControls } from "../lyric-player-fm-controls";

import { AudioFFTControl } from "../../player/horizonal/audio-fft-control";
import { PlayControls } from "./play-controls";
import { Slider } from "../appkit/np-slider";
import { AudioQualityTag } from "./audio-quality-tag";
import { SongInfoTextMarquee } from "./song-info-text-marquee";

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
	const currentAudioId = useAtomValue(currentAudioIdAtom);
	const musicId = useAtomValue(musicIdAtom);
	const songName: string = useAtomValue(songNameAtom);
	const album = useAtomValue(albumAtom);
	const songArtists = useAtomValue(songArtistsAtom);
	const currentAudioDuration = useAtomValue(currentAudioDurationAtom) / 1000;
	const [playProgress, setPlayProgress] = useAtom(playProgressAtom);
	const [playVolume, setPlayVolume] = useAtom(playVolumeAtom);
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

	const [lockPlayProgress, setLockPlayProgress] = React.useState(false);
	const [curPlayProgress, setCurPlayProgress] = React.useState(playProgress);
	const [lockPlayVolume, setLockPlayVolume] = React.useState(false);
	const [curVolume, setCurVolume] = React.useState(playVolume);

	React.useLayoutEffect(() => {
		if (!lockPlayProgress) setCurPlayProgress(playProgress);
	}, [lockPlayProgress, playProgress]);

	React.useLayoutEffect(() => {
		if (!lockPlayVolume) setCurVolume(playVolume);
	}, [lockPlayVolume, playVolume]);

	const playProgressText = toDuration(curPlayProgress);
	const remainText = toDuration(curPlayProgress - currentAudioDuration);

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
						<div className="am-music-info-with-menu">
							<div className="am-music-info">
								{!hideMusicName &&
									(hideMusicAlbum || songName !== album.name) && (
										<SongInfoTextMarquee>
											<div className="am-music-name">{songName}</div>
										</SongInfoTextMarquee>
									)}
								{!hideMusicAlbum && (
									<SongInfoTextMarquee>
										<div className="am-music-album">
											<a href={`#/m/album/?id=${album.id}`}>{album.name}</a>
										</div>
									</SongInfoTextMarquee>
								)}
								{!hideMusicArtists && (
									<SongInfoTextMarquee>
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
									</SongInfoTextMarquee>
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
								<Slider
									onAfterChange={(v) => {
										setPlayProgress(v);
										setLockPlayProgress(false);
										legacyNativeCmder._envAdapter.callAdapter(
											"audioplayer.seek",
											() => {},
											[
												currentAudioId,
												genAudioPlayerCommand(currentAudioId, "seek"),
												v,
											],
										);
									}}
									onBeforeChange={() => {
										setLockPlayProgress(true);
									}}
									onChange={setCurPlayProgress}
									value={curPlayProgress}
									min={0}
									max={currentAudioDuration}
								/>
								<div className="am-music-progress-tips">
									<div>{playProgressText}</div>
									{!hideAudioQualityTag && <AudioQualityTag />}
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
							<Slider
								beforeIcon={() => <IconVolume2 color="#FFFFFF" />}
								afterIcon={() => <IconVolume color="#FFFFFF" />}
								onAfterChange={(v) => {
									setPlayVolume(v);
									setLockPlayVolume(false);
									legacyNativeCmder._envAdapter.callAdapter(
										"audioplayer.setVolume",
										() => {},
										["", "", v],
									);
								}}
								onBeforeChange={() => {
									setLockPlayVolume(true);
								}}
								onChange={(v) => {
									setCurVolume(v);
									legacyNativeCmder._envAdapter.callAdapter(
										"audioplayer.setVolume",
										() => {},
										["", "", v],
									);
								}}
								value={curVolume}
								step={0.01}
								min={0.0}
								max={1.0}
							/>
						</div>
					)}

					{widgetUnderProgressBar === "audio-viz-fft" && <AudioFFTControl />}

					<div className="am-music-info-bottom-spacer" />
				</div>
			)}
		</>
	);
};

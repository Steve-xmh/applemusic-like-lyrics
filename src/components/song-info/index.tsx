import { Loader, LoadingOverlay } from "@mantine/core";
import { IconDots, IconVolume, IconVolume2 } from "@tabler/icons";
import { useAtomValue } from "jotai";
import * as React from "react";
import { AudioQualityType, PlayState, setClipboardData } from "../../api";
import { useAlbumImageUrl, useConfigBoolean } from "../../api/react";
import {
	albumAtom,
	musicIdAtom,
	songArtistsAtom,
	songNameAtom,
	albumImageUrlAtom,
	playProgressAtom,
	currentAudioDurationAtom,
	playVolumeAtom,
	playStateAtom,
	currentAudioQualityTypeAtom,
} from "../../core/states";
import { Menu, MenuItem } from "../appkit/menu";
import { LyricPlayerFMControls } from "../lyric-player-fm-controls";

export const PlayerSongInfoMenuContent: React.FC<{
	onCloseMenu: () => void;
}> = (props) => {
	const musicId = useAtomValue(musicIdAtom);
	const album = useAtomValue(albumAtom);
	const songArtists = useAtomValue(songArtistsAtom);
	const songName: string = useAtomValue(songNameAtom);
	const albumImageUrl = useAtomValue(albumImageUrlAtom);
	return (
		<>
			<MenuItem
				label={`复制音乐 ID：${musicId}`}
				onClick={() => setClipboardData(String(musicId))}
			/>
			<MenuItem label={`复制音乐名称：${songName}`} />
			{songArtists.length === 1 && (
				<MenuItem
					label={`查看歌手：${songArtists[0].name}`}
					onClick={() => {
						location.hash = `#/m/artist/?id=${songArtists[0].id}`;
						props.onCloseMenu();
					}}
				/>
			)}
			{songArtists.length > 1 && (
				<MenuItem label="查看歌手...">
					{songArtists.map((a) => (
						<MenuItem
							label={a.name}
							key={`song-artist-${a.id}`}
							onClick={() => {
								location.hash = `#/m/artist/?id=${a.id}`;
								props.onCloseMenu();
							}}
						/>
					))}
				</MenuItem>
			)}
			{album && (
				<MenuItem
					label={`查看专辑：${album.name}`}
					onClick={() => {
						location.hash = `#/m/album/?id=${album?.id}`;
						props.onCloseMenu();
					}}
				/>
			)}
			<MenuItem
				label="复制专辑图片链接"
				labelOnly={albumImageUrl === null}
				onClick={() => {
					// 去除缓存链接头
					let t = albumImageUrl;
					if (t) {
						if (t.startsWith("orpheus://cache/?")) {
							t = t.slice(17);
						}
						setClipboardData(t);
						props.onCloseMenu();
					}
				}}
			/>
			<MenuItem
				label="在浏览器打开专辑图片"
				labelOnly={albumImageUrl === null}
				onClick={() => {
					let t = albumImageUrl;
					if (t) {
						if (t.startsWith("orpheus://cache/?")) {
							t = t.slice(17);
						}
						betterncm.ncm.openUrl(t);
						props.onCloseMenu();
					}
				}}
			/>
		</>
	);
};

import IconPause from "../../assets/icon_pause.svg";
import IconRewind from "../../assets/icon_rewind.svg";
import IconForward from "../../assets/icon_forward.svg";
import IconShuffle from "../../assets/icon_shuffle.svg";
import IconRepeat from "../../assets/icon_repeat.svg";
import IconPlay from "../../assets/icon_play.svg";
import IconLossless from "../../assets/icon_lossless.svg";
import IconDolbyAtmos from "../../assets/icon_dolby_atmos.svg";

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
	const musicId = useAtomValue(musicIdAtom);
	const songName: string = useAtomValue(songNameAtom);
	const songArtists = useAtomValue(songArtistsAtom);
	const currentAudioDuration = useAtomValue(currentAudioDurationAtom) / 1000;
	const playProgress = useAtomValue(playProgressAtom);
	const playVolume = useAtomValue(playVolumeAtom);
	const playState = useAtomValue(playStateAtom);
	const albumImageUrl = useAlbumImageUrl(musicId, 64, 64);
	const [songInfoMenu, setSongInfoMenu] = React.useState(false);

	const [hideAlbumImage] = useConfigBoolean("hideAlbumImage", false);
	const [hideMusicName] = useConfigBoolean("hideMusicName", false);
	const [hideMusicAlias] = useConfigBoolean("hideMusicAlias", false);
	const [hideMusicArtists] = useConfigBoolean("hideMusicArtists", false);
	const [hideMusicAlbum] = useConfigBoolean("hideMusicAlbum", false);

	const playProgressText = toDuration(playProgress);
	const remainText = toDuration(playProgress - currentAudioDuration);

	return (
		<>
			<Menu onClose={() => setSongInfoMenu(false)} opened={songInfoMenu}>
				<PlayerSongInfoMenuContent onCloseMenu={() => setSongInfoMenu(false)} />
			</Menu>
			{!(
				hideAlbumImage &&
				hideMusicName &&
				hideMusicAlias &&
				hideMusicArtists &&
				hideMusicAlbum
			) && (
				<div
					className="am-player-song-info"
					onContextMenu={(evt) => {
						setSongInfoMenu(true);
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
						<div className="am-music-info-with-menu">
							<div className="am-music-info">
								<div className="am-music-name">{songName}</div>
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
							</div>
							<button
								className="am-music-main-menu"
								onClick={() => setSongInfoMenu(true)}
							>
								<IconDots color="#FFFFFF" />
							</button>
							{props.isFM && <LyricPlayerFMControls />}
						</div>

						<div className="am-music-progress-control">
							<div className="am-music-progress-bar">
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
					</div>

					<div className="am-music-controls">
						<button className="am-music-track-shuffle">
							<IconShuffle color="#FFFFFF" />
						</button>
						<button
							className="am-music-track-prev"
							onClick={() => {
								document
									.querySelector<HTMLButtonElement>("#main-player .btnc-prv")
									?.click();
							}}
						>
							<IconRewind color="#FFFFFF" />
						</button>
						<button
							className="am-music-play"
							onClick={() => {
								if (playState === PlayState.Playing) {
									document
										.querySelector<HTMLButtonElement>(
											"#main-player .btnp-pause",
										)
										?.click();
								} else {
									document
										.querySelector<HTMLButtonElement>("#main-player .btnp-play")
										?.click();
								}
							}}
						>
							{playState === PlayState.Playing ? (
								<IconPause color="#FFFFFF" />
							) : (
								<IconPlay color="#FFFFFF" />
							)}
						</button>
						<button
							className="am-music-track-next"
							onClick={() => {
								document
									.querySelector<HTMLButtonElement>("#main-player .btnc-nxt")
									?.click();
							}}
						>
							<IconForward color="#FFFFFF" />
						</button>
						<button className="am-music-track-repeat">
							<IconRepeat color="#FFFFFF" />
						</button>
					</div>

					<div className="am-music-volume-controls">
						<IconVolume2 color="#FFFFFF" />
						<div className="am-music-volume-bar">
							<div style={{ width: `${playVolume * 100}%` }} />
						</div>
						<IconVolume color="#FFFFFF" />
					</div>

					<div className="am-music-info-bottom-spacer" />
				</div>
			)}
		</>
	);
};

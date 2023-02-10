import { Loader, LoadingOverlay } from "@mantine/core";
import { useAtomValue } from "jotai";
import * as React from "react";
import { setClipboardData } from "../../api";
import { useAlbumImageUrl, useConfigBoolean } from "../../api/react";
import {
	albumAtom,
	musicIdAtom,
	songAliasNameAtom,
	songArtistsAtom,
	songNameAtom,
	albumImageUrlAtom,
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

export const PlayerSongInfo: React.FC<{
	isFM?: boolean;
}> = (props) => {
	const musicId = useAtomValue(musicIdAtom);
	const album = useAtomValue(albumAtom);
	const songName: string = useAtomValue(songNameAtom);
	const songAliasName: string[] = useAtomValue(songAliasNameAtom);
	const songArtists = useAtomValue(songArtistsAtom);
	const albumImageUrl = useAlbumImageUrl(musicId, 64, 64);
	const [songInfoMenu, setSongInfoMenu] = React.useState(false);

	const [hideAlbumImage] = useConfigBoolean("hideAlbumImage", false);
	const [hideMusicName] = useConfigBoolean("hideMusicName", false);
	const [hideMusicAlias] = useConfigBoolean("hideMusicAlias", false);
	const [hideMusicArtists] = useConfigBoolean("hideMusicArtists", false);
	const [hideMusicAlbum] = useConfigBoolean("hideMusicAlbum", false);

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
					<div className="am-music-info">
						{!hideMusicName && <div className="am-music-name">{songName}</div>}
						{!hideMusicAlias && songAliasName.length > 0 && (
							<div className="am-music-alias">
								{songAliasName.map((alia, index) => (
									<div key={`${alia}-${index}`}>{alia}</div>
								))}
							</div>
						)}
						{!hideMusicArtists && (
							<div className="am-music-artists">
								<div className="am-artists-label">歌手：</div>
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
						{!hideMusicAlbum && album && (
							<div className="am-music-album">
								<div className="am-album-label">专辑：</div>
								<div className="am-album">
									<a href={`#/m/album/?id=${album?.id}`}>{album.name}</a>
								</div>
							</div>
						)}
						{props.isFM && <LyricPlayerFMControls />}
					</div>
					<div className="am-music-info-bottom-spacer" />
				</div>
			)}
		</>
	);
};

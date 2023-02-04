import { Loader, LoadingOverlay } from "@mantine/core";
import { useAtomValue } from "jotai";
import * as React from "react";
import { useAlbumImageUrl, useConfigBoolean } from "../../api/react";
import {
	albumAtom,
	musicIdAtom,
	songAliasNameAtom,
	songArtistsAtom,
	songNameAtom,
} from "../../core/states";
import { Menu, MenuItem } from "../appkit/menu";
import { LyricPlayerFMControls } from "../lyric-player-fm-controls";

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
				<MenuItem label={`复制音乐 ID：${musicId}`} />
				<MenuItem label="复制专辑图片链接" />
				<MenuItem label="保存专辑图片" />
				<MenuItem label="复制音乐名称" />
				{songArtists.length === 1 && (
					<MenuItem label={`查看歌手：${songArtists[0].name}`} />
				)}
				{songArtists.length > 1 && (
					<MenuItem label="查看歌手...">
						{songArtists.map((a) => (
							<MenuItem label={a.name} key={`song-artist-${a.id}`} />
						))}
					</MenuItem>
				)}
				{album && <MenuItem label={`查看专辑：${album.name}`} />}
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
				</div>
			)}
		</>
	);
};

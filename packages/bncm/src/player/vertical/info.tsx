import { useAtomValue, useSetAtom } from "jotai";
import type { FC } from "react";
import {
	showAlbumNameAtom,
	showMenuButtonAtom,
	showMusicArtistsAtom,
	showMusicNameAtom,
} from "../../components/config/atoms";
import {
	musicAlbumIdAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicNameAtom,
} from "../../music-context/wrapper";
import IconMore from "../../assets/icon_more.svg?react";
import { SongInfoTextMarquee } from "../../components/song-info/song-info-text-marquee";
import { closeLyricPage } from "../../injector";
import { topbarMenuOpenedAtom } from "../common/main-menu";

export const MusicInfo: FC = () => {
	const musicName = useAtomValue(musicNameAtom);
	const musicAlbumName = useAtomValue(musicAlbumNameAtom);
	const musicAlbumId = useAtomValue(musicAlbumIdAtom);
	const artists = useAtomValue(musicArtistsAtom);

	const showMusicName = useAtomValue(showMusicNameAtom);
	const showMusicArtists = useAtomValue(showMusicArtistsAtom);
	const showMenuButton = useAtomValue(showMenuButtonAtom);
	const showAlbumName = useAtomValue(showAlbumNameAtom);

	const setMenuOpened = useSetAtom(topbarMenuOpenedAtom);

	return (
		<div className="amll-music-info">
			<div
				style={{
					display: "flex",
					flex: "1",
					flexDirection: "column",
					minWidth: "0",
				}}
			>
				{showMusicName && (
					<SongInfoTextMarquee>
						<div className="amll-music-name">{musicName}</div>
					</SongInfoTextMarquee>
				)}
				{showAlbumName && (
					<SongInfoTextMarquee>
						<div className="amll-music-album">
							<a
								className="amll-music-album"
								href={`#/m/album/?id=${musicAlbumId}`}
								onMouseUp={() => {
									closeLyricPage();
								}}
							>
								{musicAlbumName}
							</a>
						</div>
					</SongInfoTextMarquee>
				)}
				{showMusicArtists && (
					<SongInfoTextMarquee>
						<div className="amll-music-artists">
							{artists.map((artist) => (
								<a
									href={`#/m/artist/?id=${artist.id}`}
									key={`artist-${artist.id}-${artist.name}`}
									onMouseUp={() => {
										closeLyricPage();
									}}
								>
									{artist.name}
								</a>
							))}
						</div>
					</SongInfoTextMarquee>
				)}
			</div>
			{showMenuButton && (
				<button
					type="button"
					className="am-music-main-menu"
					onClick={() => {
						setMenuOpened(true);
					}}
				>
					<IconMore color="#FFFFFF" />
				</button>
			)}
		</div>
	);
};

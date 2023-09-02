import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type { FC } from "react";
import {
	showAlbumNameAtom,
	showAudioQualityTagAtom,
	showMenuButtonAtom,
	showMusicArtistsAtom,
	showMusicNameAtom,
} from "../../components/config/atoms";
import {
	currentTimeAtom,
	musicAlbumIdAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicDurationAtom,
	musicNameAtom,
} from "../../music-context/wrapper";
import IconMore from "../../assets/icon_more.svg";
import { SongInfoTextMarquee } from "../../components/song-info/song-info-text-marquee";
import { closeLyricPage } from "../../injector";
import { Slider } from "../../components/appkit/np-slider";
import { topbarMenuOpenedAtom } from "../common/main-menu";
import { AudioQualityTag } from "../../components/song-info/audio-quality-tag";
import { PlayControls } from "../../components/song-info/play-controls";
import { VolumeControl } from "../common/volume-control";

function toDuration(duration: number) {
	const isRemainTime = duration < 0;

	const d = Math.abs(duration | 0);
	const sec = d % 60;
	const min = Math.floor((d - sec) / 60);
	const secText = "0".repeat(2 - sec.toString().length) + sec;

	return `${isRemainTime ? "-" : ""}${min}:${secText}`;
}

export const MusicInfo: FC = () => {
	const [currentTime, setCurrentTime] = useAtom(currentTimeAtom);
	const musicName = useAtomValue(musicNameAtom);
	const musicAlbumName = useAtomValue(musicAlbumNameAtom);
	const musicAlbumId = useAtomValue(musicAlbumIdAtom);
	const artists = useAtomValue(musicArtistsAtom);
	const musicDuration = useAtomValue(musicDurationAtom);
	const showQualityTag = useAtomValue(showAudioQualityTagAtom);

	const showMusicName = useAtomValue(showMusicNameAtom);
	const showMusicArtists = useAtomValue(showMusicArtistsAtom);
	const showMenuButton = useAtomValue(showMenuButtonAtom);
	const showAlbumName = useAtomValue(showAlbumNameAtom);

	const setMenuOpened = useSetAtom(topbarMenuOpenedAtom);

	const playProgressText = toDuration(currentTime / 1000);
	const remainText = toDuration((currentTime - musicDuration) / 1000);

	return (
		<div className="amll-music-info">
			<div
				style={{
					display: "flex",
				}}
			>
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
							<a
								className="amll-music-album"
								href={`#/m/album/?id=${musicAlbumId}`}
								onMouseUp={() => {
									closeLyricPage();
								}}
							>
								{musicAlbumName}
							</a>
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
			<div className="am-music-progress-control">
				<Slider
					onChange={setCurrentTime}
					value={currentTime}
					min={0}
					max={musicDuration}
				/>
				<div className="am-music-progress-tips">
					<div>{playProgressText}</div>
					{showQualityTag && <AudioQualityTag />}
					<div>{remainText}</div>
				</div>
			</div>
			<PlayControls />
			<VolumeControl />
		</div>
	);
};

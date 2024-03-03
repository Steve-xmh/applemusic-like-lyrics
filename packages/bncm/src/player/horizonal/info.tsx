import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type { FC } from "react";
import {
	MusicControlType,
	musicControlTypeAtom,
	showAlbumNameAtom,
	showAudioQualityTagAtom,
	showMenuButtonAtom,
	showMusicArtistsAtom,
	showMusicNameAtom,
	showVolumeSliderAtom,
} from "../../components/config/atoms";
import {
	currentTimeAtom,
	displayMusicArtistsAtom,
	displayMusicNameAtom,
	musicAlbumIdAtom,
	musicAlbumNameAtom,
	musicDurationAtom,
	seekingAtom,
} from "../../music-context/wrapper";
import IconMore from "../../assets/icon_more.svg?react";
import { SongInfoTextMarquee } from "../../components/song-info/song-info-text-marquee";
import { closeLyricPage } from "../../injector";
import { Slider } from "../../components/appkit/np-slider";
import { topbarMenuOpenedAtom } from "../common/main-menu";
import { AudioQualityTag } from "../../components/song-info/audio-quality-tag";
import { PlayControls } from "../../components/song-info/play-controls";
import { VolumeControl } from "../common/volume-control";
import { AudioFFTControl } from "./audio-fft-control";
import {
	ConnectionColor,
	wsConnectionStatusAtom,
} from "../../music-context/ws-states";

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
	const musicName = useAtomValue(displayMusicNameAtom);
	const musicAlbumName = useAtomValue(musicAlbumNameAtom);
	const musicAlbumId = useAtomValue(musicAlbumIdAtom);
	const artists = useAtomValue(displayMusicArtistsAtom);
	const musicDuration = useAtomValue(musicDurationAtom);
	const showQualityTag = useAtomValue(showAudioQualityTagAtom);
	const musicControlType = useAtomValue(musicControlTypeAtom);
	const showVolumeSlider = useAtomValue(showVolumeSliderAtom);
	const wsConnectionStatus = useAtomValue(wsConnectionStatusAtom);

	const showMusicName = useAtomValue(showMusicNameAtom);
	const showMusicArtists = useAtomValue(showMusicArtistsAtom);
	const showMenuButton = useAtomValue(showMenuButtonAtom);
	const showAlbumName = useAtomValue(showAlbumNameAtom);

	const setMenuOpened = useSetAtom(topbarMenuOpenedAtom);

	const playProgressText = toDuration(currentTime / 1000);
	const remainText = toDuration((currentTime - musicDuration) / 1000);

	const [seeking, setSeekingAtom] = useAtom(seekingAtom);

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
							<div className="amll-music-album">
								<a
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
			<div className="am-music-progress-control">
				<Slider
					onChange={setCurrentTime}
					onSeeking={setSeekingAtom}
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
			{musicControlType === MusicControlType.Default && (
				<>
					<PlayControls />
					{showVolumeSlider && <VolumeControl />}
				</>
			)}
			{musicControlType === MusicControlType.BarVisualizer &&
				wsConnectionStatus.color !== ConnectionColor.Active && (
					<>
						<AudioFFTControl />
					</>
				)}
		</div>
	);
};

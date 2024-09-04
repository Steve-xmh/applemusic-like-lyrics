import {
	fftDataAtom,
	hideLyricViewAtom,
	isLyricPageOpenedAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicCoverAtom,
	musicCoverIsVideoAtom,
	musicDurationAtom,
	musicNameAtom,
	musicPlayingAtom,
	musicPlayingPositionAtom,
	musicVolumeAtom,
	onClickControlThumbAtom,
	onPlayOrResumeAtom,
	onRequestNextSongAtom,
	onRequestPrevSongAtom,
} from "@applemusic-like-lyrics/react-full";
import { useStore } from "jotai";
import { useEffect, type FC } from "react";
import {
	emitAudioThreadRet,
	emitAudioThread,
	listenAudioThreadEvent,
	type AudioInfo,
} from "../../utils/player";

export const MusicContext: FC = () => {
	const store = useStore();

	useEffect(() => {
		const toEmitThread = (type: Parameters<typeof emitAudioThread>[0]) => ({
			onEmit() {
				emitAudioThread(type);
			},
		});
		const toEmit = (onEmit) => ({
			onEmit,
		});
		store.set(onRequestNextSongAtom, toEmitThread("nextSong"));
		store.set(onRequestPrevSongAtom, toEmitThread("prevSong"));
		store.set(onPlayOrResumeAtom, toEmitThread("resumeOrPauseAudio"));
		store.set(
			onClickControlThumbAtom,
			toEmit(() => {
				store.set(isLyricPageOpenedAtom, false);
			}),
		);
		store.set(hideLyricViewAtom, true); // TODO: 暂无歌词
		const syncMusicInfo = (musicInfo: AudioInfo) => {
			console.log(musicInfo);
			store.set(musicNameAtom, musicInfo.name);
			store.set(musicAlbumNameAtom, musicInfo.album);
			store.set(
				musicArtistsAtom,
				musicInfo.artist.split("/").map((v) => ({
					id: v.trim(),
					name: v.trim(),
				})),
			);
			store.set(musicPlayingPositionAtom, (musicInfo.position * 1000) | 0);
			store.set(musicDurationAtom, (musicInfo.duration * 1000) | 0);
			if (musicInfo.cover) {
				const imgBlob = new Blob([new Uint8Array(musicInfo.cover)], {
					type: "image",
				});
				const imgUrl = URL.createObjectURL(imgBlob);
				try {
					const oldUrl = store.get(musicCoverAtom);
					if (oldUrl.startsWith("blob:")) {
						URL.revokeObjectURL(oldUrl);
					}
				} catch (e) {
					console.warn(e);
				}
				store.set(musicCoverAtom, imgUrl);
				store.set(musicCoverIsVideoAtom, false);
			} else {
				store.set(musicCoverAtom, "data:image/gif;base64,R0lGODlhAQABAAAAACw=");
				store.set(musicCoverIsVideoAtom, false);
			}
		};
		const unlistenPromise = listenAudioThreadEvent((evt) => {
			const evtData = evt.payload.data;
			switch (evtData.type) {
				case "playPosition": {
					store.set(
						musicPlayingPositionAtom,
						(evtData.data.position * 1000) | 0,
					);
					break;
				}
				case "loadProgress": {
					break;
				}
				case "loadAudio": {
					syncMusicInfo(evtData.data.musicInfo);
					break;
				}
				case "loadingAudio": {
					break;
				}
				case "syncStatus": {
					store.set(musicPlayingAtom, evtData.data.isPlaying);
					syncMusicInfo(evtData.data.musicInfo);
					break;
				}
				case "playStatus": {
					store.set(musicPlayingAtom, evtData.data.isPlaying);
					break;
				}
				case "setDuration": {
					store.set(musicDurationAtom, evtData.data.duration);
					break;
				}
				case "loadError": {
					break;
				}
				case "volumeChanged": {
					store.set(musicVolumeAtom, evtData.data.volume);
					break;
				}
				case "fftData": {
					store.set(fftDataAtom, evtData.data.data);
					break;
				}
			}
		});
		emitAudioThreadRet("syncStatus");
		return () => {
			unlistenPromise.then((unlisten) => unlisten());
		};
	}, [store]);

	return null;
};

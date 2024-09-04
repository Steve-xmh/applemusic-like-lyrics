import {
    fftDataAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicNameAtom,
	musicPlayingAtom,
	musicPlayingPositionAtom,
} from "@applemusic-like-lyrics/react-full";
import { useStore } from "jotai";
import { useEffect, type FC } from "react";
import { listenAudioThreadEvent } from "../../utils/player";

export const MusicContext: FC = () => {
	const store = useStore();

	useEffect(() => {
		const unlistenPromise = listenAudioThreadEvent((evt) => {
			const evtData = evt.payload.data;
			switch (evtData.type) {
				case "playPosition": {
					store.set(musicPlayingPositionAtom, evtData.data.position);
					break;
				}
				case "loadProgress": {
					break;
				}
				case "loadAudio": {
					store.set(musicPlayingPositionAtom, evtData.data.musicInfo.position);
					store.set(musicNameAtom, evtData.data.musicInfo.name);
					store.set(musicAlbumNameAtom, evtData.data.musicInfo.album);
					store.set(
						musicArtistsAtom,
						evtData.data.musicInfo.artist.split(",").map((v) => ({
							id: v.trim(),
							name: v.trim(),
						})),
					);
					break;
				}
				case "loadingAudio": {
					break;
				}
				case "syncStatus": {
					store.set(musicPlayingPositionAtom, evtData.data.musicInfo.position);
					store.set(musicNameAtom, evtData.data.musicInfo.name);
					store.set(musicAlbumNameAtom, evtData.data.musicInfo.album);
					store.set(
						musicArtistsAtom,
						evtData.data.musicInfo.artist.split(",").map((v) => ({
							id: v.trim(),
							name: v.trim(),
						})),
					);
					break;
				}
				case "playStatus": {
					break;
				}
				case "setDuration": {
					break;
				}
				case "loadError": {
					break;
				}
				case "volumeChanged": {
					break;
				}
				case "fftData": {
                    store.set(fftDataAtom, evtData.data.data);
					break;
				}
			}
		});
		return () => {
			unlistenPromise.then((unlisten) => unlisten());
		};
	}, [store]);

	return null;
};

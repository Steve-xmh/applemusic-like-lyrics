import { FC, useEffect, useRef } from "react";
import "./App.css";
import {
	globalStore,
	AMLLEnvironment,
	amllEnvironmentAtom,
} from "@applemusic-like-lyrics/bncm/src/injector/index.tsx";
import { LyricPlayer } from "@applemusic-like-lyrics/bncm/src/player/index.tsx";
import "@applemusic-like-lyrics/bncm/src/index.sass";
import { Provider, useSetAtom } from "jotai";
import { Client, ResponseType, getClient } from "@tauri-apps/api/http";
import { ErrorBoundary } from "react-error-boundary";
import {
	MusicContextBase,
	PlayState,
} from "@applemusic-like-lyrics/bncm/src/music-context";
import {
	lyricPageOpenedAtom,
	musicAlbumIdAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicCoverAtom,
	musicDurationAtom,
	musicIdAtom,
	musicNameAtom,
	musicQualityAtom,
	rawCurrentTimeAtom,
	rawCurrentVolumeAtom,
	rawMusicContextAtom,
	rawPlayStatusAtom,
} from "@applemusic-like-lyrics/bncm/src/music-context/wrapper";
import { MusicContextAMLLPlayer } from "./player-context";
import {
	EAPILyricResponse,
	LyricProvider,
	getLyricFromNCMAtom,
} from "@applemusic-like-lyrics/bncm/src/lyric/provider";

function ErrorRender({ error, resetErrorBoundary }) {
	console.error(error);
	return (
		<div>
			<h2>An unrecoverable error has occured</h2>
			<code>
				<pre>
					{error.message}
					{error.stack}
				</pre>
			</code>
		</div>
	);
}

let client: Client;

export const MusicInfoWrapper: FC = () => {
	const musicCtx = useRef<MusicContextBase>();
	const setMusicId = useSetAtom(musicIdAtom);
	const setMusicName = useSetAtom(musicNameAtom);
	const setMusicArtists = useSetAtom(musicArtistsAtom);
	const setMusicCover = useSetAtom(musicCoverAtom);
	const setMusicAlbumId = useSetAtom(musicAlbumIdAtom);
	const setMusicAlbumName = useSetAtom(musicAlbumNameAtom);
	const setCurrentTime = useSetAtom(rawCurrentTimeAtom);
	const setPlayStatus = useSetAtom(rawPlayStatusAtom);
	const setVolume = useSetAtom(rawCurrentVolumeAtom);
	const setMusicContext = useSetAtom(rawMusicContextAtom);
	const setMusicDuration = useSetAtom(musicDurationAtom);
	const setMusicQuality = useSetAtom(musicQualityAtom);
	// const setCurrentPlayMode = useSetAtom(rawPlayModeAtom);

	useEffect(() => {
		// if (location.hostname === "localhost") return;
		musicCtx.current = new MusicContextAMLLPlayer();
		if (musicCtx.current) {
			musicCtx.current.addEventListener(
				"load",
				function (this: MusicContextBase) {
					setMusicId(this.getMusicId());
					setMusicName(this.getMusicName());
					setMusicDuration(this.getMusicDuration());
					setMusicQuality(this.getMusicQuality());
					setPlayStatus(this.getPlayState());
					setMusicAlbumId(this.getMusicAlbumId());
					setMusicAlbumName(this.getMusicAlbumName());
					setMusicArtists(this.getMusicArtists().map((v) => ({ ...v })));
					setVolume(this.getVolume());
				},
			);
			musicCtx.current.addEventListener(
				"pause",
				function (this: MusicContextBase) {
					setPlayStatus(PlayState.Pausing);
				},
			);
			musicCtx.current.addEventListener(
				"resume",
				function (this: MusicContextBase) {
					setPlayStatus(PlayState.Playing);
				},
			);
			musicCtx.current.addEventListener(
				"album-updated",
				function (this: MusicContextBase) {
					setMusicCover(this.getMusicCoverImage());
				},
			);
			musicCtx.current.addEventListener(
				"progress",
				function (this: MusicContextBase, evt) {
					setCurrentTime(evt.detail.progress);
				},
			);
			musicCtx.current.addEventListener(
				"volume",
				function (this: MusicContextBase, evt) {
					setVolume(evt.detail.volume);
				},
			);
			setPlayStatus(musicCtx.current.getPlayState());
		}
		// const onPageOpened = () => setLyricPageOpened(true);
		// const onPageClosed = () => setLyricPageOpened(false);

		// window.addEventListener("amll-lyric-page-opened", onPageOpened);
		// window.addEventListener("amll-lyric-page-closed", onPageClosed);
		setMusicContext(musicCtx.current);

		return () => {
			musicCtx.current?.dispose();
			// window.removeEventListener("amll-lyric-page-opened", onPageOpened);
			// window.removeEventListener("amll-lyric-page-closed", onPageClosed);
		};
	}, []);

	// useEffect(() => {
	// 	if (musicCtx.current) {
	// 		setCurrentPlayMode(musicCtx.current.getPlayMode());
	// 	}
	// }, [lyricPageOpened]);

	return null;
};

function App() {
	globalStore.set(amllEnvironmentAtom, AMLLEnvironment.AMLLPlayer);
	globalStore.set(lyricPageOpenedAtom, true);
	globalStore.set(getLyricFromNCMAtom, {
		async getLyric(songId: string, _signal?: AbortSignal) {
			client ??= await getClient();
			const res = await client.get(
				`https://music.163.com/api/song/lyric/v1?tv=0&lv=0&rv=0&kv=0&yv=0&ytv=0&yrv=0&cp=false&id=${songId}`,
				{ responseType: ResponseType.JSON },
			);
			if (res.ok) return res.data as EAPILyricResponse;
			throw `${res.status} ${res.data}`;
		},
	});
	return (
		<ErrorBoundary fallbackRender={ErrorRender}>
			<Provider store={globalStore}>
				<LyricProvider />
				<MusicInfoWrapper />
				<LyricPlayer />
			</Provider>
		</ErrorBoundary>
	);
}

export default App;

import { FC, useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
	currentTimeAtom,
	musicArtistsAtom,
	musicContextAtom,
	musicCoverAtom,
	musicDurationAtom,
	musicIdAtom,
	musicNameAtom,
	currentVolumeAtom,
	playStatusAtom,
} from "./wrapper";
import { log, warn } from "../utils/logger";
import { toBody, parseBody } from "@applemusic-like-lyrics/ws-protocol";
import { enableWSPlayer, wsPlayerURL } from "../components/config/atoms";
import { debounce } from "../utils/debounce";
import { lyricLinesAtom } from "../lyric/provider";
import { MusicStatusGetterEvents } from ".";
import { ConnectionColor, wsConnectionStatusAtom } from "./ws-states";

export const WebSocketWrapper: FC = () => {
	const musicId = useAtomValue(musicIdAtom);
	const musicName = useAtomValue(musicNameAtom);
	const musicCover = useAtomValue(musicCoverAtom);
	const musicDuration = useAtomValue(musicDurationAtom);
	const lyricLines = useAtomValue(lyricLinesAtom);
	const artists = useAtomValue(musicArtistsAtom);
	const musicContext = useAtomValue(musicContextAtom);
	const playProgress = useAtomValue(currentTimeAtom);
	const volume = useAtomValue(currentVolumeAtom);
	const currentPlayMode = useAtomValue(playStatusAtom);
	const setWSStatus = useSetAtom(wsConnectionStatusAtom);
	const enabled = useAtomValue(enableWSPlayer);
	const url = useAtomValue(wsPlayerURL);
	const ws = useRef<WebSocket>();

	useEffect(() => {
		ws.current?.send(
			toBody({
				type: "setMusicId",
				value: {
					id: musicId,
					name: musicName,
					duration: musicDuration,
				},
			}),
		);
	}, [musicId, musicName, musicDuration, ws.current]);

	useEffect(() => {
		ws.current?.send(
			toBody({
				type: "setMusicArtists",
				value: {
					artists: artists.map((v) => ({
						id: String(v.id),
						name: v.name,
					})),
				},
			}),
		);
	}, [artists, ws.current]);

	useEffect(() => {
		ws.current?.send(
			toBody({
				type: "onPlayProgress",
				value: {
					progress: playProgress,
				},
			}),
		);
	}, [playProgress, ws.current]);

	useEffect(() => {
		ws.current?.send(
			toBody({
				type: "setVolume",
				value: {
					volume: volume,
				},
			}),
		);
	}, [volume, ws.current]);

	useEffect(() => {
		if (lyricLines.state === "hasData") {
			ws.current?.send(
				toBody({
					type: "setLyric",
					value: {
						data: lyricLines.data.map((v) => ({
							...v,
							startTime: v.startTime | 0,
							words: v.words.map((w) => ({
								...w,
								startTime: w.startTime | 0,
								endTime: w.endTime | 0,
							})),
						})),
					},
				}),
			);
		}
	}, [lyricLines, ws.current]);

	useEffect(() => {
		ws.current?.send(
			toBody({
				type: "setMusicAlbumCoverImageURL",
				value: {
					imgUrl: musicCover,
				},
			}),
		);
	}, [musicCover, ws.current]);

	useEffect(() => {
		if (musicContext && ws.current?.readyState === WebSocket.OPEN) {
			musicContext.acquireAudioData();
			const onAudioData = (evt: MusicStatusGetterEvents["audio-data"]) => {
				ws.current?.send(
					toBody({
						type: "onAudioData",
						value: {
							data: new Uint8Array(evt.detail.data),
						},
					}),
				);
			};
			musicContext.addEventListener("audio-data", onAudioData);
			return () => {
				musicContext.removeEventListener("audio-data", onAudioData);
				musicContext.releaseAudioData();
			};
		}
	}, [musicContext, ws.current?.readyState]);

	useEffect(() => {
		if (!enabled) {
			setWSStatus({
				color: ConnectionColor.Disabled,
				progress: false,
				text: "未开启",
			});
			return;
		}
		let webSocket: WebSocket | undefined = undefined;
		let canceled = false;

		const connect = () => {
			if (canceled) return;
			setWSStatus({
				progress: true,
				color: ConnectionColor.Connecting,
				text: "正在连接",
			});

			webSocket?.close();
			webSocket = new WebSocket(url);
			const nowWS = webSocket;

			webSocket.addEventListener("message", (evt) => {
				if (nowWS !== webSocket || canceled) return;
				const data = parseBody(evt.data);
				switch (data.type) {
					case "setPlayProgress":
						musicContext?.seekToPosition(data.value.progress);
						break;
					case "ping":
						webSocket?.send(toBody({ type: "pong" }));
						break;
					case "pause":
						musicContext?.pause();
						break;
					case "resume":
						musicContext?.resume();
						break;
					case "forwardSong":
						musicContext?.forwardSong();
						break;
					case "backwardSong":
						musicContext?.rewindSong();
						break;
					case "setVolume":
						musicContext?.setVolume(data.value.volume);
				}
			});

			webSocket.addEventListener("error", () => {
				if (nowWS !== webSocket || canceled) return;
				webSocket = undefined;
				ws.current = undefined;
				setWSStatus({
					progress: false,
					color: ConnectionColor.Error,
					text: "连接失败，五秒后重试",
				});
				warn("连接到播放器失败");
				enqueueConnect();
			});

			webSocket.addEventListener("close", () => {
				if (nowWS !== webSocket || canceled) return;
				webSocket = undefined;
				ws.current = undefined;
				setWSStatus({
					progress: false,
					color: ConnectionColor.Error,
					text: "连接已关闭，五秒后重试",
				});
				warn("连接到播放器失败");
				enqueueConnect();
			});

			webSocket.addEventListener("open", () => {
				if (nowWS !== webSocket || canceled) return;
				setWSStatus({
					progress: false,
					color: ConnectionColor.Active,
					text: "已连接",
				});
				log("已连接到播放器");
				ws.current?.close();
				ws.current = webSocket;
			});
		};
		const enqueueConnect = debounce(connect, 5000);

		connect();

		return () => {
			webSocket?.close();
			webSocket = undefined;
			canceled = true;
			setWSStatus({
				color: ConnectionColor.Disabled,
				progress: false,
				text: "未开启",
			});
		};
	}, [enabled, url]);

	return null;
};

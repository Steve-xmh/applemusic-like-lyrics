import {
	hideLyricViewAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicCoverAtom,
	musicDurationAtom,
	musicLyricLinesAtom,
	musicNameAtom,
	musicPlayingAtom,
	musicPlayingPositionAtom,
	onChangeVolumeAtom,
	onPlayOrResumeAtom,
	onRequestNextSongAtom,
	onRequestPrevSongAtom,
	onSeekPositionAtom,
} from "@applemusic-like-lyrics/react-full";
import { invoke } from "@tauri-apps/api/core";
import { type Event, listen } from "@tauri-apps/api/event";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { type FC, useEffect, useTransition } from "react";
import { toast } from "react-toastify";
import {
	musicIdAtom,
	wsProtocolConnectedAddrsAtom,
	wsProtocolListenAddrAtom,
} from "../../states";
import { emitAudioThread } from "../../utils/player";

export const WSProtocolMusicContext: FC = () => {
	const wsProtocolListenAddr = useAtomValue(wsProtocolListenAddrAtom);
	const setConnectedAddrs = useSetAtom(wsProtocolConnectedAddrsAtom);
	const store = useStore();
	const { t } = useTransition();

	useEffect(() => {
		emitAudioThread("pauseAudio");
	}, []);

	useEffect(() => {
		setConnectedAddrs(new Set());
		store.set(musicNameAtom, "等待连接中");
		store.set(musicAlbumNameAtom, "");
		store.set(musicCoverAtom, "");
		store.set(musicArtistsAtom, []);

		const toEmit = <T,>(onEmit: T) => ({
			onEmit,
		});
		store.set(
			onRequestNextSongAtom,
			toEmit(() => {
				toast(
					t(
						"ws-protocol.toast.switchSongNotSupported",
						"WS Protocol 模式下无法切换歌曲",
					),
				);
			}),
		);
		store.set(
			onRequestPrevSongAtom,
			toEmit(() => {
				toast(
					t(
						"ws-protocol.toast.switchSongNotSupported",
						"WS Protocol 模式下无法切换歌曲",
					),
				);
			}),
		);
		store.set(
			onPlayOrResumeAtom,
			toEmit(() => {
				toast(
					t(
						"ws-protocol.toast.pauseOrPlaySongNotSupported",
						"WS Protocol 模式下无法暂停 / 继续播放音乐",
					),
				);
			}),
		);
		store.set(
			onSeekPositionAtom,
			toEmit(() => {
				toast(
					t(
						"ws-protocol.toast.seekNotSupported",
						"WS Protocol 模式下无法修改播放进度",
					),
				);
			}),
		);
		store.set(
			onChangeVolumeAtom,
			toEmit(() => {
				toast(
					t(
						"ws-protocol.toast.changeVolumeNotSupported",
						"WS Protocol 模式下无法修改音量",
					),
					{
						toastId: "ws-protocol-change-volume",
					},
				);
			}),
		);

		const unlistenConnected = listen<string>(
			"on-ws-protocol-client-connected",
			(evt) => {
				invoke("ws_boardcast_message", {
					data: {
						type: "ping",
						value: {},
					} as WSBodyMap["ping"],
				});
				setConnectedAddrs((prev) => new Set([...prev, evt.payload]));
			},
		);

		interface WSArtist {
			id: string;
			name: string;
		}

		interface WSLyricWord {
			startTime: number;
			endTime: number;
			word: string;
		}

		interface WSLyricLine {
			words: WSLyricWord[];
			isBG: boolean;
			isDuet: boolean;
			translatedLyric: string;
			romanLyric: string;
		}

		type WSBodyMessageMap = {
			// biome-ignore lint/complexity/noBannedTypes:
			ping: {};
			// biome-ignore lint/complexity/noBannedTypes:
			pong: {};
			setMusicId: {
				id: string;
				name: string;
				duration: number;
			};
			setMusicAlbum: {
				id: string;
				name: string;
			};
			setMusicAlbumCoverImageURL: {
				imgUrl: string;
			};
			setMusicAlbumCoverImageData: {
				data: number[];
			};
			setMusicArtists: {
				artists: WSArtist[];
			};
			onLoadProgress: {
				progress: number;
			};
			onPlayProgress: {
				progress: number;
			};
			// biome-ignore lint/complexity/noBannedTypes:
			onPaused: {};
			// biome-ignore lint/complexity/noBannedTypes:
			onResumed: {};
			setPlayProgress: {
				progress: number;
			};
			onAudioData: {
				data: number[];
			};
			setLyric: {
				data: WSLyricLine[];
			};
			// biome-ignore lint/complexity/noBannedTypes:
			pause: {};
			// biome-ignore lint/complexity/noBannedTypes:
			resume: {};
			// biome-ignore lint/complexity/noBannedTypes:
			forwardSong: {};
			// biome-ignore lint/complexity/noBannedTypes:
			backwardSong: {};
			setVolume: {
				volume: number;
			};
		};

		type WSBodyMap = {
			[T in keyof WSBodyMessageMap]: {
				type: T;
				value: WSBodyMessageMap[T];
			};
		};

		function onBody(evt: Event<WSBodyMap[keyof WSBodyMessageMap]>) {
			const payload = evt.payload;

			switch (payload.type) {
				case "setMusicId": {
					store.set(musicIdAtom, payload.value.id);
					store.set(musicNameAtom, payload.value.name);
					store.set(musicDurationAtom, payload.value.duration);
					store.set(musicPlayingPositionAtom, 0);
					break;
				}
				case "setMusicAlbumCoverImageURL": {
					store.set(musicCoverAtom, payload.value.imgUrl);
					break;
				}
				case "onPlayProgress": {
					store.set(musicPlayingAtom, true);
					store.set(musicPlayingPositionAtom, payload.value.progress);
					break;
				}
				case "setMusicArtists": {
					store.set(
						musicArtistsAtom,
						payload.value.artists.map((v) => ({
							id: v.id,
							name: v.name,
						})),
					);
					break;
				}
				case "setLyric": {
					const processed = payload.value.data.map((line) => ({
						...line,
						startTime: Math.min(
							...line.words
								.filter((v) => v.word.trim().length > 0)
								.map((v) => v.startTime),
						),
						endTime: Math.max(
							...line.words
								.filter((v) => v.word.trim().length > 0)
								.map((v) => v.endTime),
						),
					}));
					if (processed.length > 0) {
						store.set(hideLyricViewAtom, false);
					}
					store.set(musicLyricLinesAtom, processed);
					break;
				}
				default:
					console.log("on-ws-protocol-client-body", payload);
			}
		}

		const unlistenBody = listen("on-ws-protocol-client-body", onBody);
		const unlistenDisconnected = listen<string>(
			"on-ws-protocol-client-disconnected",
			(evt) =>
				setConnectedAddrs(
					(prev) => new Set([...prev].filter((v) => v !== evt.payload)),
				),
		);
		invoke<string[]>("ws_get_connections").then((addrs) =>
			setConnectedAddrs(new Set(addrs)),
		);
		invoke("ws_reopen_connection", {
			addr: wsProtocolListenAddr,
		});
		return () => {
			unlistenConnected.then((u) => u());
			unlistenBody.then((u) => u());
			unlistenDisconnected.then((u) => u());
			invoke("ws_reopen_connection", {
				addr: "",
			});
		};
	}, [wsProtocolListenAddr, setConnectedAddrs, store]);

	return null;
};

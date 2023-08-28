import { FC, useEffect, useRef } from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import {
	currentTimeAtom,
	musicArtistsAtom,
	musicCoverAtom,
	musicIdAtom,
	musicNameAtom,
} from "./wrapper";
import { log, warn } from "../utils/logger";
import { toBody } from "@applemusic-like-lyrics/ws-protocol";
import { enableWSPlayer, wsPlayerURL } from "../components/config/atoms";

export enum ConnectionColor {
	Disabled = "#aaaaaa",
	Connecting = "#fdcf1b",
	Active = "#36be36",
	Error = "#d01010",
}

export const wsConnectionStatusAtom = atom({
	color: ConnectionColor.Disabled,
	progress: false,
	text: "未开启",
});

export const WebSocketWrapper: FC = () => {
	const musicId = useAtomValue(musicIdAtom);
	const musicName = useAtomValue(musicNameAtom);
	const musicCover = useAtomValue(musicCoverAtom);
	const artists = useAtomValue(musicArtistsAtom);
	const playProgress = useAtomValue(currentTimeAtom);
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
				},
			}),
		);
	}, [musicId, musicName]);

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
	}, [artists]);

	useEffect(() => {
		ws.current?.send(
			toBody({
				type: "onPlayProgress",
				value: {
					progress: playProgress,
				},
			}),
		);
	}, [playProgress]);

	useEffect(() => {
		ws.current?.send(
			toBody({
				type: "setMusicAlbumCoverImageURL",
				value: {
					imgUrl: musicCover,
				},
			}),
		);
	}, [musicCover]);

	useEffect(() => {
		if (!enabled) {
			setWSStatus({
				color: ConnectionColor.Disabled,
				progress: false,
				text: "未开启",
			});
			return;
		}
		let webSocket: WebSocket;
		let canceled = false;

		const connect = () => {
			if (canceled) return;
			setWSStatus({
				progress: true,
				color: ConnectionColor.Connecting,
				text: "正在连接",
			});

			webSocket = new WebSocket(url);

			webSocket.addEventListener("error", () => {
				setWSStatus({
					progress: false,
					color: ConnectionColor.Error,
					text: "连接失败，五秒后重试",
				});
				warn("连接到播放器失败");
				setTimeout(connect, 5000);
			});

			webSocket.addEventListener("open", () => {
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

		connect();

		return () => {
			webSocket.close();
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

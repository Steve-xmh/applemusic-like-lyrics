import { type EventCallback, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { uid } from "uid";

export interface AudioThreadEventMessage<T> {
	callbackId: string;
	data: T;
}

export interface AudioQuality {
	sampleRate?: number;
	bitsPerCodedSample?: number;
	bitsPerSample?: number;
	channels?: number;
	sampleFormat?: string;
	codec?: string;
}

export interface AudioInfo {
	name: string;
	artist: string;
	album: string;
	lyric: string;
	coverMediaType: string;
	// 本质是 Uint8Array
	// TODO: 返回成 Base64？
	cover?: number[];
	duration: number;
	position: number;
}

export type SongData =
	| {
			type: "local";
			filePath: string;
			origOrder: number;
	  }
	| {
			type: "custom";
			songJsonData: string;
			origOrder: number;
	  };

export type AudioThreadMessage =
	| {
			type: "resumeAudio";
	  }
	| {
			type: "pauseAudio";
	  }
	| {
			type: "resumeOrPauseAudio";
	  }
	| {
			type: "seekAudio";
			position: number;
	  }
	| {
			type: "jumpToSong";
			songIndex: number;
	  }
	| {
			type: "prevSong";
	  }
	| {
			type: "nextSong";
	  }
	| {
			type: "setPlaylist";
	  }
	| {
			type: "setVolume";
	  }
	| {
			type: "setVolumeRelative";
	  }
	| {
			type: "setAudioOutput";
			name: string;
	  }
	| {
			type: "setFFTRange";
			fromFreq: number;
			toFreq: number;
	  }
	| {
			type: "syncStatus";
	  }
	| {
			type: "close";
	  };

export type AudioThreadEvent =
	| {
			type: "playPosition";
			data: { position: number };
	  }
	| {
			type: "loadProgress";
			data: { position: number };
	  }
	| {
			type: "loadAudio";
			data: {
				musicId: string;
				musicInfo: AudioInfo;
				quality: AudioQuality;
			};
	  }
	| {
			type: "loadingAudio";
			data: { musicId: string };
	  }
	| {
			type: "syncStatus";
			data: {
				musicId: string;
				musicInfo: AudioInfo;
				isPlaying: boolean;
				duration: number;
				position: number;
				volume: number;
				loadPosition: number;
				playlist: SongData[];
				playlistInited: boolean;
				quality: AudioQuality;
			};
	  }
	| {
			type: "playStatus";
			data: { isPlaying: boolean };
	  }
	| {
			type: "setDuration";
			data: { duration: number };
	  }
	| {
			type: "loadError";
			data: { error: string };
	  }
	| {
			type: "volumeChanged";
			data: { volume: number };
	  }
	| {
			type: "fftData";
			data: { data: number[] };
	  };

const msgTasks = new Map<string, (value: unknown) => void>();

async function initAudioThread() {
	console.log("后台线程连接初始化中");
	await listen<AudioThreadEventMessage<AudioThreadEvent>>(
		"audio_player_msg",
		(evt) => {
			const resolve = msgTasks.get(evt.payload.callbackId);
			if (resolve) {
				msgTasks.delete(evt.payload.callbackId);
				resolve(evt.payload.data);
			}
		},
	);
	console.log("后台线程连接初始化完成");
}

initAudioThread();

export const invokeSyncStatus = () => invoke("init_audio_thread");
export const listenAudioThreadEvent = (
	handler: EventCallback<AudioThreadEventMessage<AudioThreadEvent>>,
) => listen("audio_player_msg", handler);

export async function readLocalMusicMetadata(filePath: string): Promise<{
	name: string;
	artist: string;
	album: string;
	lyric: string;
	cover: number[];
	duration: number;
}> {
	return await invoke("read_local_music_metadata", { filePath });
}

export async function restartApp(): Promise<never> {
	return await invoke("restart_app");
}

export async function emitAudioThread<
	D extends AudioThreadMessage,
	T extends D["type"],
>(
	msgType: T,
	data: Omit<AudioThreadMessage, "type" | "callbackId"> = {},
): Promise<void> {
	const id = uid(32) + Date.now();
	await invoke("local_player_send_msg", {
		msg: {
			callbackId: id,
			data: {
				type: msgType,
				...data,
			},
		} as AudioThreadEventMessage<D>,
	});
}

export function emitAudioThreadRet<
	D extends AudioThreadMessage,
	T extends D["type"],
>(
	msgType: T,
	data: Omit<AudioThreadMessage, "type" | "callbackId"> = {},
): Promise<unknown> {
	const id = `${uid(32)}-${Date.now()}`;
	return new Promise((resolve) => {
		msgTasks.set(id, resolve);
		invoke("local_player_send_msg", {
			msg: {
				callbackId: id,
				data: {
					type: msgType,
					...data,
				},
			} as AudioThreadEventMessage<D>,
		});
	});
}

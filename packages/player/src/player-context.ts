import {
	Artist,
	AudioQualityType,
	MusicContextBase,
	PlayMode,
	PlayState,
} from "@applemusic-like-lyrics/bncm/src/music-context";
import { listen } from "@tauri-apps/api/event";
import {
	exists,
	readTextFile,
	writeTextFile,
	removeFile,
	createDir,
	BaseDirectory,
} from "@tauri-apps/api/fs";
import { appDataDir } from "@tauri-apps/api/path";
import { getCurrent } from "@tauri-apps/api/window";

interface WSClientBody<Type = string, Value = never> {
	type: Type;
	value: Value;
}

type WSClientBodies =
	| WSClientBody<"ping">
	| WSClientBody<"pong">
	| WSClientBody<
			"setMusicId",
			{
				id: string;
				name: string;
				duration: number;
			}
	  >
	| WSClientBody<
			"setMusicAlbum",
			{
				id: string;
				name: string;
			}
	  >
	| WSClientBody<
			"setMusicAlbumCoverImageURL",
			{
				imgUrl: string;
			}
	  >
	| WSClientBody<
			"setMusicArtists",
			{
				artists: {
					id: string;
					name: string;
				}[];
			}
	  >
	| WSClientBody<
			"setVolume",
			{
				volume: {
					volume: number;
				}[];
			}
		>
	| WSClientBody<
			"onLoadProgress",
			{
				progress: number;
			}
	  >
	| WSClientBody<
			"onPlayProgress",
			{
				progress: number;
			}
	  >
	| WSClientBody<"onPaused">
	| WSClientBody<"onResumed">
	| WSClientBody<
			"setPlayProgress",
			{
				progress: number;
			}
	  >
	| WSClientBody<
			"onAudioData",
			{
				data: number[];
			}
	  >;

export class MusicContextAMLLPlayer extends MusicContextBase {
	private cancel: () => void = () => {};
	private dataDir = "";
	constructor() {
		super();
		listen<WSClientBodies>("on-client-body", (evt) => {
			this.onClientBody(evt.payload);
		}).then((cancel) => {
			this.cancel = cancel;
		});
		appDataDir().then((dir) => {
			this.dataDir = dir;
		});
	}
	private musicId = "";
	private musicName = "";
	private musicDuration = 0;
	private musicAlbumId = "";
	private musicAlbumName = "";
	private musicArtists: Artist[] = [];
	private musicCoverImage = "";
	private volume = 0.5;
	private onClientBody(body: WSClientBodies) {
		switch (body.type) {
			case "setMusicId":
				console.log(body);
				this.musicId = body.value.id;
				this.musicName = body.value.name;
				this.musicDuration = body.value.duration;
				this.dispatchTypedEvent(
					"load",
					new CustomEvent("load"),
				);
				break;
			case "setMusicAlbum":
				this.musicAlbumId = body.value.id;
				this.musicAlbumName = body.value.name;
				this.dispatchTypedEvent(
					"load",
					new CustomEvent("load"),
				);
				break;
			case "setMusicArtists":
				this.musicArtists = body.value.artists;
				this.dispatchTypedEvent(
					"load",
					new CustomEvent("load"),
				);
				break;
			case "setMusicAlbumCoverImageURL":
				this.musicCoverImage = body.value.imgUrl;
				this.dispatchTypedEvent(
					"album-updated",
					new CustomEvent("album-updated"),
				);
				break;
			case "onPlayProgress":
				this.dispatchTypedEvent(
					"progress",
					new CustomEvent("progress", {
						detail: {
							progress: body.value.progress,
						},
					}),
				);
				break;
			case "setVolume":
				this.dispatchTypedEvent(
					"volume",
					new CustomEvent("volume", {
						detail: {
							volume: this.volume
						}
					}
					),
				);
				break;
			default:
				console.log(body);
				break;
		}
	}
	getMusicId(): string {
		return this.musicId;
	}
	getMusicDuration(): number {
		return this.musicDuration;
	}
	getMusicName(): string {
		return this.musicName;
	}
	getMusicArtists(): Artist[] {
		return this.musicArtists;
	}
	getMusicQuality(): AudioQualityType {
		return AudioQualityType.HiRes;
	}
	getMusicCoverImage(): string {
		return this.musicCoverImage;
	}
	getMusicAlbumId(): string {
		return this.musicAlbumId;
	}
	getMusicAlbumName(): string {
		return this.musicAlbumName;
	}
	getPlayState(): PlayState {
		// throw new Error("Method not implemented.");
		return PlayState.Playing;
	}
	getPlayMode(): PlayMode {
		// throw new Error("Method not implemented.");
		return PlayMode.Random;
	}
	setPlayMode(playMode: PlayMode): void {
		// throw new Error("Method not implemented.");
	}
	seekToPosition(timeMS: number): void {
		// throw new Error("Method not implemented.");
	}
	forwardSong(): void {
		// throw new Error("Method not implemented.");
	}
	rewindSong(): void {
		// throw new Error("Method not implemented.");
	}
	setVolume(value: number): void {
		// throw new Error("Method not implemented.");
		this.volume = value;
	}
	getVolume(): number {
		// throw new Error("Method not implemented.");
		return 0.5;
	}
	pause(): void {
		// throw new Error("Method not implemented.");
	}
	resume(): void {
		// throw new Error("Method not implemented.");
	}
	getDataDir(): string {
		return this.dataDir;
	}
	isFileExists(path: string): Promise<boolean> {
		return exists(path);
	}
	makeDirectory(path: string): Promise<void> {
		return createDir(path);
	}
	readFileText(path: string): Promise<string> {
		return readTextFile(path);
	}
	writeFileText(path: string, data: string): Promise<void> {
		return writeTextFile(path, data);
	}
	deleteFile(path: string): Promise<void> {
		return removeFile(path);
	}
	dispose(): void {
		this.cancel();
	}
	async setFullscreen(isFullscreen?: boolean): Promise<void> {
		if (isFullscreen) {
			getCurrent().setFullscreen(isFullscreen)
		} else {
			getCurrent().setFullscreen(false)
		}
	}
}

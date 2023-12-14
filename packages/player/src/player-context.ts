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
	override getMusicId(): string {
		return this.musicId;
	}
	override getMusicDuration(): number {
		return this.musicDuration;
	}
	override getMusicName(): string {
		return this.musicName;
	}
	override getMusicArtists(): Artist[] {
		return this.musicArtists;
	}
	override getMusicQuality(): AudioQualityType {
		return AudioQualityType.HiRes;
	}
	override getMusicCoverImage(): string {
		return this.musicCoverImage;
	}
	override getMusicAlbumId(): string {
		return this.musicAlbumId;
	}
	override getMusicAlbumName(): string {
		return this.musicAlbumName;
	}
	override getPlayState(): PlayState {
		// throw new Error("Method not implemented.");
		return PlayState.Playing;
	}
	override getPlayMode(): PlayMode {
		// throw new Error("Method not implemented.");
		return PlayMode.Random;
	}
	override setPlayMode(playMode: PlayMode): void {
		// throw new Error("Method not implemented.");
	}
	override seekToPosition(timeMS: number): void {
		// throw new Error("Method not implemented.");
	}
	override forwardSong(): void {
		// throw new Error("Method not implemented.");
	}
	override rewindSong(): void {
		// throw new Error("Method not implemented.");
	}
	override setVolume(value: number): void {
		// throw new Error("Method not implemented.");
		this.volume = value;
	}
	override getVolume(): number {
		// throw new Error("Method not implemented.");
		return 0.5;
	}
	override pause(): void {
		// throw new Error("Method not implemented.");
	}
	override resume(): void {
		// throw new Error("Method not implemented.");
	}
	override getDataDir(): string {
		return this.dataDir;
	}
	override isFileExists(path: string): Promise<boolean> {
		return exists(path);
	}
	override makeDirectory(path: string): Promise<void> {
		return createDir(path);
	}
	override readFileText(path: string): Promise<string> {
		return readTextFile(path);
	}
	override writeFileText(path: string, data: string): Promise<void> {
		return writeTextFile(path, data);
	}
	override deleteFile(path: string): Promise<void> {
		return removeFile(path);
	}
	override dispose(): void {
		this.cancel();
	}
	override async setFullscreen(isFullscreen?: boolean): Promise<void> {
		if (isFullscreen) {
			getCurrent().setFullscreen(isFullscreen)
		} else {
			getCurrent().setFullscreen(false)
		}
	}
}

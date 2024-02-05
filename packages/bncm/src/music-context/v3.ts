/**
 * @fileoverview
 * 专门给 3.0+ 设计的播放状态获取对象
 */

import {
	Artist,
	AudioQualityType,
	MusicContextBase,
	PlayMode,
	PlayState,
} from ".";
import { appendRegisterCall, removeRegisterCall } from "../utils/channel";
import { log, warn } from "../utils/logger";
import { getNCMImageUrl } from "../utils/ncm-url";
import { genRandomString } from "../utils/gen-random-string";
import { normalizePath } from "../utils/path";
import { FFTPlayer } from "@applemusic-like-lyrics/fft";

interface AudioLoadInfo {
	activeCode: number;
	code: number;
	duration: number; // 单位秒
	errorCode: number;
	errorString: string;
}

export const EMPTY_IMAGE_URL =
	"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

function genAudioPlayerCommand(audioId: string, command: string) {
	return `${audioId}|${command}|${genRandomString(6)}`;
}

export class MusicContextV3 extends MusicContextBase {
	private musicDuration = 0;
	private musicPlayProgress = 0;
	private volume = 0.5;
	private playState = PlayState.Pausing;
	private musicId = "";
	private musicName = "未知歌名";
	private musicAlbumId = "";
	private musicAlbumName = "";
	private musicAlbumImage = "";
	private artists: Artist[] = [];
	private fftPlayer = new FFTPlayer();
	private tweenAtom = Symbol("tween-atom");
	private searchForAlbumCoverAtom = Symbol("search-for-album-cover-atom");
	private readonly bindedOnMusicLoad: Function;
	private readonly bindedOnMusicUnload: Function;
	private readonly bindedOnPlayProgress: Function;
	private readonly bindedOnPlayStateChanged: Function;
	private readonly bindedOnVolumeChanged: Function;
	private readonly unsubscribeStore: Function;
	private audioId = "";
	private audioQuality = AudioQualityType.Normal;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	private store: any;
	private forcePlayPositionLerp = false;
	constructor() {
		super();
		this.bindedOnMusicLoad = this.onMusicLoad.bind(this);
		this.bindedOnMusicUnload = this.onMusicUnload.bind(this);
		this.bindedOnPlayProgress = this.onPlayProgress.bind(this);
		this.bindedOnPlayStateChanged = this.onPlayStateChanged.bind(this);
		this.bindedOnVolumeChanged = this.onVolumeChanged.bind(this);

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const store = (document.getElementById("root") as any)?._reactRootContainer
			?._internalRoot?.current?.child?.child?.memoizedProps?.store;
		if (store) {
			this.unsubscribeStore = store.subscribe(() => {
				this.store = store.getState();
				this.onStateChanged();
			});
		} else {
			this.unsubscribeStore = () => {};
			warn(
				"无法找到根组件或无法获取到 Store 状态对象，将无法正常获取歌曲播放信息！",
			);
		}

		interface NCMV3AudioData {
			data: ArrayBuffer;
			pts: number;
		}
		appendRegisterCall("AudioData", "audioplayer", (data: NCMV3AudioData) => {
			this.fftPlayer.pushDataI16(48000, 2, new Int16Array(data.data));
		});
		appendRegisterCall("Load", "audioplayer", this.bindedOnMusicLoad);
		appendRegisterCall("End", "audioplayer", this.bindedOnMusicUnload);
		// 在 Windows 版本中，这个函数会逐帧强制调用，也就是说会强制占用阻塞渲染线程
		// 过度处理可能会产生轻微卡顿，因此下面的回调要做缓冲二次回调
		appendRegisterCall(
			"PlayProgress",
			"audioplayer",
			this.bindedOnPlayProgress,
		);
		appendRegisterCall(
			"PlayState",
			"audioplayer",
			this.bindedOnPlayStateChanged,
		);
		appendRegisterCall("Volume", "audioplayer", this.bindedOnVolumeChanged);
		setTimeout(() => {
			this.onMusicLoad("", {
				code: 0,
				activeCode: 0,
				errorCode: 0,
				errorString: "",
				duration: 0,
			});
			try {
				const nmSettings = JSON.parse(
					localStorage.getItem("NM_SETTING_PLAYER") ?? "{}",
				);
				if (nmSettings?.volume) {
					this.onVolumeChanged("", 0, 0, nmSettings.volume);
				}
			} catch {}
		}, 0);
	}
	private onVolumeChanged(
		_audioId: string,
		_unknownArg0: number,
		_unknownArg1: number,
		volume: number, // [0.0-1.0]
	) {
		this.volume = volume;
		this.dispatchTypedEvent(
			"volume",
			new CustomEvent("volume", {
				detail: {
					volume: this.volume,
				},
			}),
		);
	}
	private onStateChanged() {
		const playing = this.store?.playing;

		const bitrate: number | undefined = playing?.resourcePlayingQuality;
		const envSound: string | undefined = playing?.resourcePlayingEnvSound;
		const trackFileType: string | undefined = playing?.trackFileType;
		if (envSound === "dolby") {
			this.audioQuality = AudioQualityType.DolbyAtmos;
		} else if (bitrate === undefined) {
			this.audioQuality = AudioQualityType.Local;
		} else if (bitrate <= 192) {
			this.audioQuality = AudioQualityType.Normal;
		} else if (bitrate <= 320) {
			this.audioQuality = AudioQualityType.High;
		} else if (bitrate <= 999) {
			this.audioQuality = AudioQualityType.Lossless;
		} else if (bitrate <= 1999) {
			this.audioQuality = AudioQualityType.HiRes;
		} else if (trackFileType === "local") {
			this.audioQuality = AudioQualityType.Local;
		}

		this.musicName = playing?.resourceName || "未知歌名";
		this.artists =
			playing?.resourceArtists?.map((v: Artist) => ({
				id: v.id,
				name: v.name,
			})) || [];
		this.musicPlayProgress = 0;
		this.musicId = String(playing?.resourceTrackId || "").trim();
		this.musicAlbumId = String(playing?.resourceTrackId || "");
		this.musicAlbumName = String(playing?.resourceName || "");
	}
	private onMusicLoad(audioId: string, info: AudioLoadInfo) {
		log("音乐已加载", audioId, info);
		this.audioId = audioId;
		this.musicDuration = (info.duration * 1000) | 0;
		this.dispatchTypedEvent("load", new Event("load"));
		this.searchForAlbumCover();
	}
	private async searchForAlbumCover() {
		this.searchForAlbumCoverAtom = Symbol("search-for-album-cover-atom");
		const songData = this.store?.playing;

		// const prefix = "orpheus://cache/?"; // 如果加入缓存的话会导致部分情况下无法解码图片（但是可以加载显示）
		const prefix = "";

		const urls: string[] = [];

		// TODO: 增加自定义图片源

		const originalTrackPic = songData?.resourceCoverUrl;
		if (originalTrackPic) {
			const url = `${prefix}${originalTrackPic}`;
			urls.push(`${url}?imageView&enlarge=1&thumbnail=64y64`);
			urls.push(url);
		}
		const playFile = songData?.curTrack?.filename;
		if (playFile) {
			const url = `orpheus://localmusic/pic?${encodeURIComponent(playFile)}`;
			urls.push(url, url);
		}
		const noSongImage = `${prefix}${getNCMImageUrl("16601526067802346")}`;
		urls.push(noSongImage, noSongImage);
		urls.push(EMPTY_IMAGE_URL);
		urls.push(EMPTY_IMAGE_URL);

		const atom = this.searchForAlbumCoverAtom;
		for (let curIndex = 0; curIndex < urls.length; curIndex += 2) {
			let fullReqLoaded = false;
			const fullReq = fetch(urls[curIndex + 1]).then((res) => {
				fullReqLoaded = true;
				return res;
			});
			const res = await fetch(urls[curIndex]);
			if (atom !== this.searchForAlbumCoverAtom) return;
			if (res.ok) {
				await res.blob();
				if (atom !== this.searchForAlbumCoverAtom) return;
				this.musicAlbumImage = urls[curIndex];
				if (!fullReqLoaded) {
					this.dispatchTypedEvent("album-updated", new Event("album-updated"));
				}
				const fullRes = await fullReq;
				if (atom !== this.searchForAlbumCoverAtom) return;
				if (fullRes.ok) {
					await Promise.all([
						!fullReqLoaded &&
							new Promise((resolve) => setTimeout(resolve, 500)),
						await fullRes.blob(),
					]);
					if (atom !== this.searchForAlbumCoverAtom) return;
					this.musicAlbumImage = urls[curIndex + 1];
					this.dispatchTypedEvent("album-updated", new Event("album-updated"));
					return;
				}
			}
		}
	}
	private onMusicUnload(audioId: string) {
		log("音乐已卸载", audioId);
		if (this.playState !== PlayState.Pausing) {
			this.playState = PlayState.Pausing;
			this.dispatchTypedEvent("pause", new Event("pause"));
		}
		this.dispatchTypedEvent("unload", new Event("unload"));
	}
	private progressDispatchHandle = 0;
	private lastProgress = 0;
	private onPlayProgress(
		audioId: string,
		progress: number,
		loadProgress: number,
		isTween = false,
	) {
		if (Math.abs(progress - this.lastProgress) > 1 || progress <= 0.01) {
			warn(
				"音乐播放进度异常",
				audioId,
				progress,
				loadProgress,
				this.lastProgress,
			);
			this.lastProgress = progress;
			return;
		}
		this.lastProgress = progress;
		// log("音乐加载进度", audioId, progress, loadProgress);
		if (this.playState === PlayState.Playing) {
			this.musicPlayProgress = Math.max(
				(progress * 1000) | 0,
				this.musicPlayProgress,
			);
		} else {
			this.musicPlayProgress = (progress * 1000) | 0;
		}
		if (this.progressDispatchHandle) {
			cancelAnimationFrame(this.progressDispatchHandle);
		}
		const curMusicPlayProgress = this.musicPlayProgress;
		this.progressDispatchHandle = requestAnimationFrame(() => {
			this.dispatchTypedEvent(
				"progress",
				new CustomEvent("progress", {
					detail: {
						progress: curMusicPlayProgress,
					},
				}),
			);
		});
		if (
			!isTween &&
			(APP_CONF?.isOSX || this.forcePlayPositionLerp) &&
			this.playState === PlayState.Playing
		) {
			this.tweenAtom = Symbol("tween-atom");
			const curAtom = this.tweenAtom;
			const baseTime = this.musicPlayProgress;
			let curTime: number;
			const onFrame = (time: number) => {
				if (this.tweenAtom === curAtom) {
					if (curTime === undefined) curTime = time;
					const tweenTime = (baseTime + time - curTime) / 1000;
					this.onPlayProgress(audioId, tweenTime, loadProgress, true);
					requestAnimationFrame(onFrame);
				}
			};
			requestAnimationFrame(onFrame);
		}
	}
	private onPlayStateChanged(audioId: string, stateId: string) {
		log("音乐播放状态", audioId, stateId);
		const state = stateId.split("|")[1];
		if (state === "pause") {
			this.playState = PlayState.Pausing;
			this.dispatchTypedEvent("pause", new Event("pause"));
			this.tweenAtom = Symbol("tween-atom");
		} else if (state === "resume") {
			this.playState = PlayState.Playing;
			this.dispatchTypedEvent("resume", new Event("resume"));
		}
	}
	override getMusicId() {
		return this.musicId;
	}
	override getMusicDuration() {
		return this.musicDuration;
	}
	override getMusicName() {
		return this.musicName;
	}
	override getMusicArtists() {
		return this.artists;
	}
	override getMusicCoverImage() {
		return this.musicAlbumImage;
	}
	override getPlayState() {
		return this.playState;
	}
	override getMusicQuality(): AudioQualityType {
		return this.audioQuality;
	}
	override seekToPosition(timeMS: number): void {
		this.musicPlayProgress = timeMS;
		legacyNativeCmder._envAdapter.callAdapter("audioplayer.seek", () => {}, [
			this.audioId,
			genAudioPlayerCommand(this.audioId, "seek"),
			timeMS / 1000,
		]);
	}
	override setVolume(value: number): void {
		legacyNativeCmder._envAdapter.callAdapter(
			"audioplayer.setVolume",
			() => {},
			["", "", value],
		);
	}
	override getVolume(): number {
		return 0;
	}

	override pause(): void {
		document
			.querySelector<HTMLButtonElement>("#btn_pc_minibar_play.play-pause-btn")
			?.click();
	}
	override resume(): void {
		document
			.querySelector<HTMLButtonElement>(
				"#btn_pc_minibar_play:not(.play-pause-btn)",
			)
			?.click();
	}

	forwardSong(): void {
		document
			.querySelector<HTMLButtonElement>(
				"footer > * > * > .middle > *:nth-child(1) > button:nth-child(4)",
			)
			?.click();
	}

	rewindSong(): void {
		document
			.querySelector<HTMLButtonElement>(
				"footer > * > * > .middle > *:nth-child(1) > button:nth-child(2)",
			)
			?.click();
	}

	getPlayMode(): PlayMode {
		return this.getCurrentPlayMode() ?? PlayMode.One;
	}

	setPlayMode(playMode: PlayMode): void {
		this.switchPlayMode(playMode);
	}

	setPlayPositionLerp(enable: boolean) {
		this.forcePlayPositionLerp = enable;
	}

	private getCurrentPlayMode(): PlayMode | undefined {
		try {
			// if (isNCMV3()) { // TODO: 在隔壁增加 3.0 支持
			// 	switch (appStore?.playingMode) {
			// 		case "playOrder":
			// 			return PlayMode.Order;
			// 		case "playCycle":
			// 			return PlayMode.Repeat;
			// 		case "playRandom":
			// 			return PlayMode.Random;
			// 		case "playOneCycle":
			// 			return PlayMode.One;
			// 		default:
			// 			return undefined;
			// 	}
			// } else {
			const setting = JSON.parse(
				localStorage.getItem("NM_SETTING_PLAYER") || "{}",
			);

			if (setting.mode2) {
				return PlayMode.AI;
			}

			switch (setting?.mode) {
				case "playonce":
					return PlayMode.Order;
				case "playorder":
					return PlayMode.Repeat;
				case "playcycle":
					return PlayMode.One;
				case "playrandom":
					return PlayMode.Random;
				default:
			}
			// }
		} catch {}
		return undefined;
	}

	override getDataDir(): string {
		return normalizePath(`${plugin.pluginPath}/../../amll-data`);
	}

	override setClipboard(data: string): Promise<void> {
		return new Promise((resolve) => {
			legacyNativeCmder._envAdapter.callAdapter(
				"winhelper.setClipBoardData",
				resolve,
				[data],
			);
		});
	}

	override isFileExists(path: string): Promise<boolean> {
		return betterncm.fs.exists(path);
	}

	override async makeDirectory(path: string): Promise<void> {
		await betterncm.fs.mkdir(path);
	}

	override async readFileText(path: string): Promise<string> {
		const data = await betterncm.fs.readFile(path);
		return data.text();
	}

	override async writeFileText(path: string, data: string): Promise<void> {
		await betterncm.fs.writeFile(path, data);
	}

	override async deleteFile(path: string): Promise<void> {
		await betterncm.fs.remove(path);
	}

	private switchPlayMode(playMode: PlayMode) {
		// if (isNCMV3()) {
		// 	if (playMode === PlayMode.AI) return; // 3.0.0 暂时没有心动模式 // TODO: 在隔壁增加 3.0 支持
		// 	let counter = 0;
		// 	while (counter++ < 4) {
		// 		const playModeBtn = document.querySelector<HTMLButtonElement>(
		// 			"footer > * > * > .middle > *:nth-child(1) > button:nth-child(1)",
		// 		);
		// 		const btnSpan = playModeBtn?.querySelector("span > span");
		// 		if (!(playModeBtn && btnSpan)) break;
		// 		playModeBtn.click();
		// 		const playingMode = btnSpan.ariaLabel;
		// 		console.log(btnSpan.ariaLabel);
		// 		switch (playMode) {
		// 			case PlayMode.Order:
		// 				if (playingMode === "shuffle") return;
		// 				break;
		// 			case PlayMode.Repeat:
		// 				if (playingMode === "order") return;
		// 				break;
		// 			case PlayMode.Random:
		// 				if (playingMode === "singleloop") return;
		// 				break;
		// 			case PlayMode.One:
		// 				if (playingMode === "loop") return;
		// 				break;
		// 		}
		// 	}
		// } else {
		const playModeBtn = document.querySelector<HTMLDivElement>(".type.f-cp");
		let counter = 0;
		while (playModeBtn && counter++ < 5) {
			if (playModeBtn.classList.contains(playMode)) {
				return;
			}
			playModeBtn.click();
		}
		// }
	}

	private audioDataLock = 0;
	private fftBuf = new Float32Array(64);

	private onFFTTick = () => {
		if (this.fftPlayer.read(this.fftBuf)) {
			this.dispatchTypedEvent(
				"fft-data",
				new CustomEvent("fft-data", {
					detail: {
						data: [...this.fftBuf],
					},
				}),
			);
		}

		if (this.audioDataLock) requestAnimationFrame(() => this.onFFTTick());
	};

	override acquireAudioData(): void {
		if (!this.audioDataLock++) {
			channel.call("audioplayer.enableAudioData", () => {}, [1]);
			this.onFFTTick();
		}
	}

	override releaseAudioData(): void {
		if (this.audioDataLock <= 0) {
			throw new Error("Audio data lock is already 0");
		}
		if (!--this.audioDataLock) {
			channel.call("audioplayer.enableAudioData", () => {}, [0]);
		}
	}

	getMusicAlbumId(): string {
		return this.musicAlbumId;
	}

	getMusicAlbumName(): string {
		return this.musicAlbumName;
	}
	override dispose() {
		removeRegisterCall("Load", "audioplayer", this.bindedOnMusicLoad);
		removeRegisterCall("End", "audioplayer", this.bindedOnMusicUnload);
		removeRegisterCall(
			"PlayProgress",
			"audioplayer",
			this.bindedOnPlayProgress,
		);
		removeRegisterCall(
			"PlayState",
			"audioplayer",
			this.bindedOnPlayStateChanged,
		);
		removeRegisterCall("Volume", "audioplayer", this.bindedOnVolumeChanged);
		this.unsubscribeStore();
	}
}

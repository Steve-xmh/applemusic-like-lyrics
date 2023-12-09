/**
 * @fileoverview
 * 专门给开发环境设计的播放状态获取对象
 */

import {
	Artist,
	AudioQualityType,
	MusicContextBase,
	PlayMode,
	PlayState,
} from ".";
import { log } from "../utils/logger";
import { getNCMImageUrl } from "../utils/ncm-url";

interface AudioLoadInfo {
	activeCode: number;
	code: number;
	duration: number; // 单位秒
	errorCode: number;
	errorString: string;
}

/**
 * 根据歌曲 ID 获取歌曲下载地址
 * @param songId 歌曲ID
 * @param br 歌曲码率
 * @returns 歌词数据信息
 */
function getMusic(songId: string, br = 128000) {
	return fetch(`${APP_CONF?.domain}/api/song/enhance/download/url`, {
		method: "POST",
		body: `id=${songId}&br=${br}`,
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
	}).then((v) => (v.ok ? v.json() : Promise.reject(v.status)));
}

function getMusicInfo(songId: string) {
	return fetch(`${APP_CONF?.domain}/api/v3/song/detail`, {
		method: "POST",
		body: `c=${encodeURIComponent(
			JSON.stringify([
				{
					id: songId,
				},
			]),
		)}`,
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
	}).then((v) => (v.ok ? v.json() : Promise.reject(v.status)));
}

export const EMPTY_IMAGE_URL =
	"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

export class MusicStatusGetterDev extends MusicContextBase {
	private musicDuration = 0;
	private musicPlayProgress = 0;
	private playState = PlayState.Pausing;
	private musicId = "";
	private musicName = "未知歌名";
	private musicAlbumImage = "";
	private artists: Artist[] = [];
	private tweenAtom = Symbol("tween-atom");
	private searchForAlbumCoverAtom = Symbol("search-for-album-cover-atom");
	private currentSongInfo: any;
	private audioEl: HTMLAudioElement = document.createElement("audio");
	constructor() {
		super();
		document.body.appendChild(this.audioEl);
		this.audioEl.controls = true;
		this.audioEl.preload = "auto";
		this.audioEl.style.zIndex = "2000";
		this.audioEl.addEventListener("play", () => {
			this.playState = PlayState.Playing;
		});
		this.audioEl.addEventListener("timeupdate", () => {
			this.onPlayProgress(this.musicId, this.audioEl.currentTime, 1);
		});
		setTimeout(() => {
			this.onMusicLoad(new URL(location.href).searchParams.get("id") || "", {
				code: 0,
				activeCode: 0,
				errorCode: 0,
				errorString: "",
				duration: 0,
			});
		}, 0);
	}
	private async onMusicLoad(audioId: string, info: AudioLoadInfo) {
		log("音乐已加载", audioId, info);
		this.currentSongInfo = (await getMusicInfo(audioId)).songs[0];
		log("音乐信息已加载", this.currentSongInfo);
		const file = await getMusic(audioId);
		log("音乐链接已加载", file?.data?.url);
		this.audioEl.src = file?.data?.url;
		const playing = this.getPlayingSong();
		this.musicName = playing?.name || "未知歌名";
		this.artists =
			playing?.ar?.map((v: Artist) => ({
				id: v.id,
				name: v.name,
			})) || [];
		this.musicPlayProgress = 0;
		this.musicDuration = (info.duration * 1000) | 0;
		this.musicId = String(playing?.id || "").trim();
		this.dispatchTypedEvent("load", new Event("load"));
		this.searchForAlbumCover();
	}
	private async searchForAlbumCover() {
		this.searchForAlbumCoverAtom = Symbol("search-for-album-cover-atom");
		const songData = this.getPlayingSong();

		// const prefix = "orpheus://cache/?"; // 如果加入缓存的话会导致部分情况下无法解码图片（但是可以加载显示）
		const prefix = "";

		const urls: string[] = [];

		const originalTrackPic = songData?.al?.picUrl;
		if (originalTrackPic) {
			const url = `${prefix}${originalTrackPic}`;
			urls.push(`${url}?imageView&enlarge=1&thumbnail=64y64`);
			urls.push(url);
		}
		const noSongImage = `${prefix}${getNCMImageUrl("16601526067802346")}`;
		urls.push(noSongImage, noSongImage);
		urls.push(EMPTY_IMAGE_URL);
		urls.push(EMPTY_IMAGE_URL);

		const atom = this.searchForAlbumCoverAtom;
		for (let curIndex = 0; curIndex < urls.length; curIndex += 2) {
			const fullReq = fetch(urls[curIndex + 1]);
			const res = await fetch(urls[curIndex]);
			if (atom !== this.searchForAlbumCoverAtom) return;
			if (res.ok) {
				const blob = await res.blob();
				if (atom !== this.searchForAlbumCoverAtom) return;
				if (this.musicAlbumImage.length)
					URL.revokeObjectURL(this.musicAlbumImage);
				this.musicAlbumImage = URL.createObjectURL(blob);
				this.dispatchTypedEvent("album-updated", new Event("album-updated"));
				const fullRes = await fullReq;
				if (atom !== this.searchForAlbumCoverAtom) return;
				if (fullRes.ok) {
					const fullBlob = await fullRes.blob();
					if (atom !== this.searchForAlbumCoverAtom) return;
					if (this.musicAlbumImage.length)
						URL.revokeObjectURL(this.musicAlbumImage);
					this.musicAlbumImage = URL.createObjectURL(fullBlob);
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
	private onPlayProgress(
		audioId: string,
		progress: number,
		loadProgress: number,
		isTween = false,
	) {
		// log("音乐加载进度", audioId, progress, loadProgress);
		this.musicPlayProgress = (progress * 1000) | 0;
		this.dispatchTypedEvent(
			"progress",
			new CustomEvent("progress", {
				detail: {
					progress: this.musicPlayProgress,
				},
			}),
		);
		if (!isTween && this.playState === PlayState.Playing) {
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
	private getPlayingSong() {
		return this.currentSongInfo;
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
		return AudioQualityType.DolbyAtmos;
	}
	override getMusicAlbumId(): string {
		return "";
	}
	override getMusicAlbumName(): string {
		return "";
	}
	override getPlayMode(): PlayMode {
		return PlayMode.Order;
	}
	override setPlayMode(playMode: PlayMode): void {}
	override seekToPosition(timeMS: number): void {}
	override forwardSong(): void {}
	override rewindSong(): void {}
	override setVolume(value: number): void {}
	override getVolume(): number {}
	override pause(): void {}
	override resume(): void {}
	override dispose() {
		this.audioEl.pause();
		this.audioEl.remove();
	}

	getDataDir(): string {
		return "";
	}
	async isFileExists(path: string): Promise<boolean> {
		return false;
	}
	async makeDirectory(path: string): Promise<void> {}
	async readFileText(path: string): Promise<string> {
		return "";
	}
	async writeFileText(path: string, data: string): Promise<void> {}
	async deleteFile(path: string): Promise<void> {}
	setPlayPositionLerp(enable: boolean): void {}
}

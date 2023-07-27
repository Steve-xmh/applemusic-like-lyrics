/**
 * @fileoverview
 * 专门给 2.10.X 设计的播放状态获取对象
 */

import { Artist, MusicStatusGetterBase, PlayState } from ".";
import { appendRegisterCall, removeRegisterCall } from "../utils/channel";
import { callCachedSearchFunction } from "../utils/func";
import { log } from "../utils/logger";

interface AudioLoadInfo {
	activeCode: number;
	code: number;
	duration: number; // 单位秒
	errorCode: number;
	errorString: number;
}

export const EMPTY_IMAGE_URL =
	"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";


export class MusicStatusGetterV2 extends MusicStatusGetterBase {
	private musicDuration = 0;
	private playState = PlayState.Pausing;
	private musicId = "";
	private musicName = "未知歌名";
	private musicAlbumImages = "";
	private artists: Artist[] = [];
	private searchForAlbumCoverAtom = Symbol("search-for-album-cover-atom");
	private readonly bindedOnMusicLoad: Function;
	private readonly bindedOnMusicUnload: Function;
	private readonly bindedOnPlayProgress: Function;
	private readonly bindedOnPlayStateChanged: Function;
	constructor() {
		super();
		this.bindedOnMusicLoad = this.onMusicLoad.bind(this);
		this.bindedOnMusicUnload = this.onMusicUnload.bind(this);
		this.bindedOnPlayProgress = this.onPlayProgress.bind(this);
		this.bindedOnPlayStateChanged = this.onPlayStateChanged.bind(this);
		appendRegisterCall("Load", "audioplayer", this.bindedOnMusicLoad);
		appendRegisterCall("End", "audioplayer", this.bindedOnMusicUnload);
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
	}
	private onMusicLoad(audioId: string, info: AudioLoadInfo) {
		log("音乐已加载", audioId, info);
		const playing = this.getPlayingSong();
		this.musicName = playing?.data?.name || "未知歌名";
		this.musicId = String(
			playing?.originFromTrack?.lrcid ||
				playing?.originFromTrack?.track?.tid ||
				playing?.data?.id ||
				"",
		).trim();
		this.dispatchTypedEvent("load", new Event("load"));
	}
	private async searchForAlbumCover() {
		this.searchForAlbumCoverAtom = Symbol("search-for-album-cover-atom");
		const atom = this.searchForAlbumCoverAtom;
		const songData = getPlayingSong();
		
		const urls: string[] = [];
		
		// TODO: 增加自定义图片源

		const originalTrackPic =
			songData?.originFromTrack?.track?.track?.album?.picUrl;
		if (originalTrackPic) {
			const url = `${prefix}${originalTrackPic}`;
			urls.push(
				`${url}?imageView&enlarge=1&thumbnail=${lowWidth}y${lowHeight}`,
			);
			urls.push(url);
		}
		const radioIntervenePic = songData?.data?.radio?.intervenePicUrl;
		if (radioIntervenePic) {
			const url = `${prefix}${radioIntervenePic}`;
			urls.push(
				`${url}?imageView&enlarge=1&thumbnail=${lowWidth}y${lowHeight}`,
			);
			urls.push(url);
		}
		const picUrl = songData?.data?.album?.picUrl;
		if (picUrl) {
			const url = `${prefix}${picUrl}`;
			urls.push(
				`${url}?imageView&enlarge=1&thumbnail=${lowWidth}y${lowHeight}`,
			);
			urls.push(url);
		}
		const playFile = songData?.from?.playFile;
		if (playFile) {
			const url = `orpheus://localmusic/pic?${encodeURIComponent(playFile)}`;
			urls.push(url, url);
		}
		const noSongImage = `${prefix}${getNCMImageUrl("16601526067802346")}`;
		urls.push(noSongImage, noSongImage);
		urls.push(EMPTY_IMAGE_URL);
		urls.push(EMPTY_IMAGE_URL);
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
	) {
		// log("音乐加载进度", audioId, progress, loadProgress);
		this.dispatchTypedEvent(
			"progress",
			new CustomEvent("progress", {
				detail: {
					progress: (progress * 1000) | 0,
				},
			}),
		);
	}
	private onPlayStateChanged(audioId: string, stateId: string) {
		log("音乐播放状态", audioId, stateId);
		const state = stateId.split("|")[1];
		if (state === "pause") {
			this.playState = PlayState.Pausing;
			this.dispatchTypedEvent("pause", new Event("pause"));
		} else if (state === "resume") {
			this.playState = PlayState.Playing;
			this.dispatchTypedEvent("resume", new Event("resume"));
		}
	}
	private getPlayingSong() {
		if (APP_CONF.isOSX) {
			return callCachedSearchFunction("baD", []);
		} else {
			return callCachedSearchFunction("getPlaying", []);
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
		return this.musicAlbumImages;
	}
	override getPlayState() {
		return this.playState;
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
	}
}

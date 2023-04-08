import * as React from "react";
import { getConfig, setConfig } from "../config/core";
import { GLOBAL_EVENTS } from "../utils/global-events";
import { log, warn } from "../utils/logger";
import { getNCMImageUrl, getPlayingSong } from ".";
import { useAtomValue, useSetAtom } from "jotai";
import { currentRawLyricRespAtom, lyricForceReloadAtom } from "../core/states";

export function useConfig(
	key: string,
	defaultValue: string,
): [string, React.Dispatch<string>];
export function useConfig(
	key: string,
	defaultValue?: string,
): [string | undefined, React.Dispatch<string | undefined>];
export function useConfig(
	key: string,
	defaultValue?: string,
): [string | undefined, React.Dispatch<string | undefined>] {
	const [value, setValue] = React.useState(
		getConfig(key, defaultValue) ?? defaultValue,
	);
	const eventKey = React.useMemo(() => `config-changed-${key}`, [key]);
	React.useEffect(() => {
		setConfig(key, value);
		GLOBAL_EVENTS.dispatchEvent(new Event(eventKey));
	}, [value]);
	React.useEffect(() => {
		const onConfigUpdate = () => {
			const newValue = getConfig(key, defaultValue) ?? defaultValue;
			setValue(newValue);
		};
		GLOBAL_EVENTS.addEventListener(eventKey, onConfigUpdate);
		return () => {
			GLOBAL_EVENTS.removeEventListener(eventKey, onConfigUpdate);
		};
	}, [key, defaultValue, eventKey]);
	return [value, setValue];
}

export function useConfigBoolean(
	key: string,
	defaultValue = false,
): [boolean, React.Dispatch<boolean>] {
	const [rawValue, setRawValue] = useConfig(key, defaultValue.toString());
	const value = React.useMemo(() => rawValue !== "false", [rawValue]);
	const setValue = (v: boolean) => setRawValue(v.toString());
	return [value, setValue];
}

export function useConfigNumber(
	key: string,
	defaultValue = 0,
): [number, React.Dispatch<number>] {
	const [rawValue, setRawValue] = useConfig(key, defaultValue.toString());
	const value = React.useMemo(() => Number(rawValue), [rawValue]);
	const setValue = (v: number) => setRawValue(v.toString());
	return [value, setValue];
}

export function useConfigValue(key: string, defaultValue: string): string;
export function useConfigValue(
	key: string,
	defaultValue?: string,
): string | undefined;
export function useConfigValue(
	key: string,
	defaultValue?: string,
): string | undefined {
	const [value, setValue] = React.useState(
		getConfig(key, defaultValue) ?? defaultValue,
	);
	const eventKey = React.useMemo(() => `config-changed-${key}`, [key]);
	React.useEffect(() => {
		const onConfigUpdate = () => {
			const newValue = getConfig(key, defaultValue) ?? defaultValue;
			setValue(newValue);
		};
		GLOBAL_EVENTS.addEventListener(eventKey, onConfigUpdate);
		return () => {
			GLOBAL_EVENTS.removeEventListener(eventKey, onConfigUpdate);
		};
	}, [key, defaultValue, eventKey]);
	return value;
}

export function useConfigValueBoolean(
	key: string,
	defaultValue = false,
): boolean {
	const rawValue = useConfigValue(key, defaultValue.toString());
	const value = React.useMemo(() => rawValue !== "false", [rawValue]);
	return value;
}

export function useConfigValueNumber(key: string, defaultValue = 0): number {
	const rawValue = useConfigValue(key, defaultValue.toString());
	const value = React.useMemo(() => Number(rawValue), [rawValue]);
	return value;
}

export function useNowPlayingOpened(): boolean {
	const [value, setValue] = React.useState(
		!!document.getElementById("applemusic-like-lyrics-view"),
	);
	React.useEffect(() => {
		setValue(!!document.getElementById("applemusic-like-lyrics-view"));
		const onLyricPageOpen = () => {
			log("歌词页面已显示");
			setValue(true);
		};
		const onLyricPageHide = () => {
			log("歌词页面已隐藏");
			setValue(false);
		};
		GLOBAL_EVENTS.addEventListener("lyric-page-open", onLyricPageOpen);
		GLOBAL_EVENTS.addEventListener("lyric-page-hide", onLyricPageHide);
		return () => {
			GLOBAL_EVENTS.removeEventListener("lyric-page-open", onLyricPageOpen);
			GLOBAL_EVENTS.removeEventListener("lyric-page-hide", onLyricPageHide);
		};
	}, []);

	return value;
}

export function useLFPSupported(): [boolean, boolean] {
	const [supported, setSupported] = React.useState(
		!!loadedPlugins.LibFrontendPlay,
	);
	const [enabled, setEnabled] = React.useState(
		!!loadedPlugins.LibFrontendPlay?.enabled,
	);

	React.useEffect(() => {
		const lfpPlugin = loadedPlugins.LibFrontendPlay;
		setSupported(!!lfpPlugin);
		if (lfpPlugin) {
			const onEnabled = () => setEnabled(true);
			const onDisabled = () => setEnabled(false);
			lfpPlugin.addEventListener("pluginEnabled", onEnabled);
			lfpPlugin.addEventListener("pluginDisabled", onDisabled);
			setEnabled(lfpPlugin.enabled);
			return () => {
				lfpPlugin.removeEventListener("pluginEnabled", onEnabled);
				lfpPlugin.removeEventListener("pluginDisabled", onDisabled);
			};
		}
	}, []);

	return [supported, enabled];
}

export function useFMOpened(): boolean {
	const [value, setValue] = React.useState(location.hash === "#/m/fm/");
	React.useEffect(() => {
		const onHashChange = () => {
			setValue(location.hash === "#/m/fm/");
		};
		window.addEventListener("hashchange", onHashChange);
		return () => {
			window.removeEventListener("hashchange", onHashChange);
		};
	}, []);

	return value;
}

export const EMPTY_IMAGE_URL =
	"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const genEmptyImage = () => {
	const img = new Image();
	return img;
};

export function useAlbumImage(
	musicId: number | string,
	lowWidth?: number,
	lowHeight?: number,
): [boolean, HTMLImageElement, string] {
	const imageLoader = React.useRef(genEmptyImage());
	const [shouldLowQuality, setShouldLowQuality] = React.useState(
		lowWidth && lowHeight && lowWidth * lowHeight > 0,
	);
	const currentRawLyricResp = useAtomValue(currentRawLyricRespAtom);
	// const prefix = "orpheus://cache/?"; // 如果加入缓存的话会导致部分情况下无法解码图片（但是可以加载显示）
	const prefix = "";

	const albumImageUrls = React.useMemo(() => {
		const songData = getPlayingSong();
		const urls: string[] = [];

		if (currentRawLyricResp.albumImageUrl) {
			urls.push(currentRawLyricResp.albumImageUrl);
			urls.push(currentRawLyricResp.albumImageUrl);
		}

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
		return urls;
	}, [musicId, shouldLowQuality, lowWidth, lowHeight, currentRawLyricResp]);

	const [selectedUrl, setSelectedUrl] = React.useState("");

	React.useEffect(() => {
		setShouldLowQuality(lowWidth && lowHeight && lowWidth * lowHeight > 0);
	}, [lowWidth, lowHeight]);

	React.useEffect(() => {
		if (albumImageUrls.length === 0) {
			setSelectedUrl(EMPTY_IMAGE_URL);
			return;
		}
		setSelectedUrl("");
		let selected = shouldLowQuality ? 0 : 1;
		const onLoad = () => {
			if (albumImageUrls.includes(imageLoader.current.src)) {
				setSelectedUrl(albumImageUrls[selected]);
				if (selected % 2 === 0 && shouldLowQuality) {
					selected++;
					if (albumImageUrls[selected]) {
						imageLoader.current.src = albumImageUrls[selected];
					}
					imageLoader.current.addEventListener("load", onLoad, {
						once: true,
					});
					imageLoader.current.addEventListener("error", onError, {
						once: true,
					});
				}
			}
		};
		const onError = (evt: ErrorEvent) => {
			if (selected % 2 === 1 && shouldLowQuality) {
				// 重试
				let url = albumImageUrls[selected];
				if (url.lastIndexOf("?") !== -1) {
					url += `&t=${Date.now()}`;
				} else {
					url += `?t=${Date.now()}`;
				}
				imageLoader.current.src = url;
				imageLoader.current.addEventListener("load", onLoad, {
					once: true,
				});
				imageLoader.current.addEventListener("error", onError, {
					once: true,
				});
				return;
			}
			selected += 2;
			if (albumImageUrls[selected]) {
				warn(
					"专辑图",
					albumImageUrls[selected - 2],
					"加载失败，正在尝试下一张",
					evt,
				);
				imageLoader.current.src = albumImageUrls[selected];
				imageLoader.current.addEventListener("load", onLoad, {
					once: true,
				});
				imageLoader.current.addEventListener("error", onError, {
					once: true,
				});
			} else {
				warn(
					"专辑图",
					albumImageUrls[selected - 2],
					"加载失败，已无可用图链",
					evt,
				);
				setSelectedUrl(EMPTY_IMAGE_URL);
			}
		};
		imageLoader.current.addEventListener("load", onLoad, {
			once: true,
		});
		imageLoader.current.addEventListener("error", onError, {
			once: true,
		});
		imageLoader.current.src = albumImageUrls[selected];
		return () => {
			imageLoader.current.removeEventListener("load", onLoad);
			imageLoader.current.removeEventListener("error", onError);
		};
	}, [albumImageUrls, shouldLowQuality]);

	return [selectedUrl.length > 0, imageLoader.current, selectedUrl];
}

export function useAlbumImageUrl(
	musicId: number | string,
	lowWidth?: number,
	lowHeight?: number,
): string {
	const [, , selectedUrl] = useAlbumImage(musicId, lowWidth, lowHeight);

	return selectedUrl;
}

export function useForceUpdate(): () => void {
	const [_updateState, setUpdateState] = React.useState({});
	const forceUpdate = React.useCallback(() => setUpdateState({}), []);
	return forceUpdate;
}

export function useReloadLyricByCurrentAudioId() {
	const setLyricForceReload = useSetAtom(lyricForceReloadAtom);

	return async () => {
		setLyricForceReload(Symbol("lyric-force-reload-atom"));
	};
}

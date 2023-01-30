import * as React from "react";
import { getConfig, setConfig } from "../config/core";
import { version } from "../../manifest.json";
import { GLOBAL_EVENTS } from "../utils/global-events";
import { log, warn } from "../utils/logger";
import { getNCMImageUrl, getPlayingSong } from ".";
import { atom, useAtom } from "jotai";

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

const lfpPluginSupported = atom(!!loadedPlugins.LibFrontendPlay);
const lfpPluginEnabled = atom(false);
export function useLFPSupported(): [boolean, boolean] {
	const [supported, setSupported] = useAtom(lfpPluginSupported);
	const [enabled, setEnabled] = useAtom(lfpPluginEnabled);

	React.useEffect(() => {
		if (loadedPlugins.LibFrontendPlay) {
			setSupported(true);
		}
	}, []);

	React.useEffect(() => {
		const lfpPlugin = loadedPlugins.LibFrontendPlay;
		if (lfpPlugin && supported) {
			const onEnabled = () => setSupported(true);
			const onDisabled = () => setSupported(false);
			lfpPlugin.addEventListener("pluginEnabled", onEnabled);
			lfpPlugin.addEventListener("pluginDisabled", onDisabled);
			setEnabled(lfpPlugin.enabled);
			return () => {
				lfpPlugin.removeEventListener("pluginEnabled", onEnabled);
				lfpPlugin.removeEventListener("pluginDisabled", onDisabled);
			};
		}
	}, [supported]);

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

let cachedLatestVersion: string | undefined;

export async function checkGithubLatestVersion(force = false): Promise<string> {
	// https://ghproxy.com/https://raw.githubusercontent.com/Steve-xmh/applemusic-like-lyrics/main/dist/manifest.json
	// https://raw.githubusercontent.com/Steve-xmh/applemusic-like-lyrics/main/dist/manifest.json

	if (force) {
		cachedLatestVersion = undefined;
	}

	if (cachedLatestVersion !== undefined) {
		return cachedLatestVersion;
	}

	const GITHUB_DIST_MANIFEST_URL =
		"https://raw.githubusercontent.com/Steve-xmh/applemusic-like-lyrics/main/dist/manifest.json";

	try {
		const manifest = (await (
			await fetch(`https://ghproxy.com/${GITHUB_DIST_MANIFEST_URL}`)
		).json()) as typeof import("../../dist/manifest.json");
		if (cachedLatestVersion !== manifest.version) {
			GLOBAL_EVENTS.dispatchEvent(new Event("latest-version-updated"));
		}
		cachedLatestVersion = manifest.version;
		return cachedLatestVersion;
	} catch {}

	try {
		const manifest = (await (
			await fetch(GITHUB_DIST_MANIFEST_URL)
		).json()) as typeof import("../../dist/manifest.json");
		if (cachedLatestVersion !== manifest.version) {
			GLOBAL_EVENTS.dispatchEvent(new Event("latest-version-updated"));
		}
		cachedLatestVersion = manifest.version;
		return cachedLatestVersion;
	} catch {}

	return cachedLatestVersion || "";
}

export function useGithubLatestVersion(): string {
	const [version, setVersion] = React.useState("");

	React.useEffect(() => {
		const checkUpdate = () => checkGithubLatestVersion().then(setVersion);
		checkUpdate();
		GLOBAL_EVENTS.addEventListener("latest-version-updated", checkUpdate);
		return () => {
			GLOBAL_EVENTS.removeEventListener("latest-version-updated", checkUpdate);
		};
	}, []);

	return version;
}

export function useHasUpdates(): boolean {
	const githubVersion = useGithubLatestVersion();
	return React.useMemo(
		() => githubVersion !== "" && githubVersion !== version,
		[githubVersion],
	);
}

export const EMPTY_IMAGE_URL =
	"data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

const genEmptyImage = () => {
	const img = new Image();
	return img;
};

export function useAlbumImageUrl(
	musicId: number | string,
	lowWidth?: number,
	lowHeight?: number,
): string {
	const imageLoader = React.useRef(genEmptyImage());
	const [shouldLowQuality, setShouldLowQuality] = React.useState(
		lowWidth && lowHeight && lowWidth * lowHeight > 0,
	);

	const albumImageUrls = React.useMemo(() => {
		const songData = getPlayingSong();
		const urls: string[] = [];
		const originalTrackPic =
			songData?.originFromTrack?.track?.track?.album?.picUrl;
		if (originalTrackPic) {
			const url = `orpheus://cache/?${originalTrackPic}`;
			urls.push(
				`${url}?imageView&type=webp&enlarge=1&thumbnail=${lowWidth}y${lowHeight}`,
			);
			urls.push(url);
		}
		const radioIntervenePic = songData?.data?.radio?.intervenePicUrl;
		if (radioIntervenePic) {
			const url = `orpheus://cache/?${radioIntervenePic}`;
			urls.push(
				`${url}?imageView&type=webp&enlarge=1&thumbnail=${lowWidth}y${lowHeight}`,
			);
			urls.push(url);
		}
		const picUrl = songData?.data?.album?.picUrl;
		if (picUrl) {
			const url = `orpheus://cache/?${picUrl}`;
			urls.push(
				`${url}?imageView&type=webp&enlarge=1&thumbnail=${lowWidth}y${lowHeight}`,
			);
			urls.push(url);
		}
		const playFile = songData?.from?.playFile;
		if (playFile) {
			const url = `orpheus://localmusic/pic?${encodeURIComponent(playFile)}`;
			urls.push(url, url);
		}
		const noSongImage = `orpheus://cache/?${getNCMImageUrl(
			"16601526067802346",
		)}`;
		urls.push(noSongImage, noSongImage);
		urls.push(EMPTY_IMAGE_URL);
		urls.push(EMPTY_IMAGE_URL);
		return urls;
	}, [musicId, shouldLowQuality, lowWidth, lowHeight]);

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

	return selectedUrl;
}

export function useForceUpdate(): [{}, () => void] {
	const [updateState, setUpdateState] = React.useState({});
	const forceUpdate = React.useCallback(() => setUpdateState({}), []);
	return [updateState, forceUpdate];
}

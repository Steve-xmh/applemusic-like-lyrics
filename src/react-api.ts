import * as React from "react";
import { getConfig, setConfig } from "./config/core";
import { version } from "../manifest.json";
import { GLOBAL_EVENTS } from "./global-events";
import { log } from "./logger";
import { getNCMImageUrl, getPlayingSong } from "./api";

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
		getConfig(key, defaultValue) || defaultValue,
	);
	const eventKey = React.useMemo(() => `config-changed-${key}`, [key]);
	React.useEffect(() => {
		setConfig(key, value);
		GLOBAL_EVENTS.dispatchEvent(new Event(eventKey));
	}, [value]);
	React.useEffect(() => {
		const onConfigUpdate = () => {
			const newValue = getConfig(key, defaultValue) || defaultValue;
			setValue(newValue);
		};
		GLOBAL_EVENTS.addEventListener(eventKey, onConfigUpdate);
		return () => {
			GLOBAL_EVENTS.removeEventListener(eventKey, onConfigUpdate);
		};
	}, [key, defaultValue, eventKey]);
	return [value, setValue];
}

export function useNowPlayingOpened(): boolean {
	const [value, setValue] = React.useState(
		!!document.getElementById("applemusic-like-lyrics-view"),
	);
	React.useEffect(() => {
		setValue(!!document.getElementById("applemusic-like-lyrics-view"));
		log(
			"applemusic-like-lyrics-view",
			value,
			!!document.getElementById("applemusic-like-lyrics-view"),
		);
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
		).json()) as typeof import("../dist/manifest.json");
		if (cachedLatestVersion !== manifest.version) {
			GLOBAL_EVENTS.dispatchEvent(new Event("latest-version-updated"));
		}
		cachedLatestVersion = manifest.version;
		return cachedLatestVersion;
	} catch {}

	try {
		const manifest = (await (
			await fetch(GITHUB_DIST_MANIFEST_URL)
		).json()) as typeof import("../dist/manifest.json");
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
	img.src = EMPTY_IMAGE_URL;
	return img;
};

export function useAlbumImageUrl(musicId: number | string): string {
	const imageLoader = React.useRef(genEmptyImage());
	const albumImageUrls = React.useMemo(() => {
		const songData = getPlayingSong();
		const urls: string[] = [];
		const radioIntervenePic = songData?.data?.radio?.intervenePicUrl;
		if (radioIntervenePic) {
			urls.push(`orpheus://cache/?${radioIntervenePic}`);
		}
		const picUrl = songData?.data?.album?.picUrl;
		if (picUrl) {
			urls.push(`orpheus://cache/?${picUrl}`);
		}
		const playFile = songData?.from?.playFile;
		if (playFile) {
			urls.push(`orpheus://localmusic/pic?${encodeURIComponent(playFile)}`);
		}
		urls.push(`orpheus://cache/?${getNCMImageUrl("16601526067802346")}`);
		urls.push(EMPTY_IMAGE_URL);
		log(urls);
		return urls;
	}, [musicId]);

	const [selectedUrl, setSelectedUrl] = React.useState("");

	React.useEffect(() => {
		if (albumImageUrls.length === 0) {
			setSelectedUrl(EMPTY_IMAGE_URL);
			return;
		}
		setSelectedUrl("");
		let selected = 0;
		const onLoad = () => {
			if (albumImageUrls.includes(imageLoader.current.src)) {
				setSelectedUrl(albumImageUrls[selected]);
			}
		};
		const onError = () => {
			selected++;
			if (albumImageUrls[selected]) {
				imageLoader.current.src = albumImageUrls[selected];
			} else {
				setSelectedUrl(EMPTY_IMAGE_URL);
			}
		};
		imageLoader.current.addEventListener("load", onLoad);
		imageLoader.current.addEventListener("error", onError);
		imageLoader.current.src = albumImageUrls[0];
		return () => {
			imageLoader.current.removeEventListener("load", onLoad);
			imageLoader.current.removeEventListener("error", onError);
		};
	}, [albumImageUrls]);

	return selectedUrl;
}

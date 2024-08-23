export function loadImage(imageUrl: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = document.createElement("img");
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = imageUrl;
		img.crossOrigin = "anonymous";
		img.loading = "eager";
	});
}

export function loadVideo(videoUrl: string): Promise<HTMLVideoElement> {
	return new Promise((resolve, reject) => {
		const video = document.createElement("video");
		let playing = false;
		let timeupdate = false;
		let rejected = false;
		video.addEventListener(
			"playing",
			() => {
				playing = true;
				checkReady();
			},
			true,
		);
		video.addEventListener(
			"timeupdate",
			() => {
				timeupdate = true;
				checkReady();
			},
			true,
		);
		video.addEventListener(
			"error",
			(err) => {
				rejected = true;
				reject(err);
			},
			true,
		);
		function checkReady() {
			if (playing && timeupdate && !rejected) {
				resolve(video);
			}
		}
		video.src = videoUrl;
		video.playsInline = true;
		video.crossOrigin = "anonymous";
		video.autoplay = true;
		video.loop = true;
		video.muted = true;
		video.play();
	});
}

export function loadResourceFromUrl(
	url: string,
	isVideo = false,
): Promise<HTMLImageElement | HTMLVideoElement> {
	return isVideo ? loadVideo(url) : loadImage(url);
}

export function loadResourceFromElement(
	element: HTMLImageElement | HTMLVideoElement,
): Promise<HTMLImageElement | HTMLVideoElement> {
	return new Promise((resolve, reject) => {
		if (
			element instanceof HTMLImageElement
				? element.complete
				: element.readyState >= 3
		) {
			resolve(element);
		} else {
			element.onload = () => resolve(element);
			element.onerror = reject;
		}
	});
}

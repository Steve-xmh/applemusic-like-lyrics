/**
 * @fileoverview
 * 此处是一个简易的组件加载测试脚本，用来调试歌词
 *
 * @author SteveXMH
 */

import GUI from "lil-gui";
import { BackgroundRender } from "./bg-render";
import Stats from "stats.js";
import { LyricPlayer } from "./lyric-player";
import { parseTTML } from "./lyric/ttml";

const audio = document.createElement("audio");

const debugValues = {
	lyric: new URL(location.href).searchParams.get("lyric") || "",
	music: new URL(location.href).searchParams.get("music") || "",
	album: new URL(location.href).searchParams.get("album") || "",
	bgFPS: 30,
	bgPlaying: true,
	currentTime: 0,
	play() {
		if (!audio.src) audio.load();
		audio.play();
	},
};

audio.src = debugValues.music;
audio.load();

const gui = new GUI();

gui.title("AMLL 歌词测试页面");
gui
	.add(debugValues, "lyric")
	.name("歌词文件")
	.onFinishChange(async (url: string) => {
		lyricPlayer.setLyricLines(parseTTML(await (await fetch(url)).text()));
	});
gui.add(debugValues, "music").name("歌曲");
gui
	.add(debugValues, "album")
	.name("专辑图片")
	.onFinishChange((v: string) => {
		bg.setAlbumImage(v);
	});

const bgGui = gui.addFolder("背景");
bgGui
	.add(debugValues, "bgPlaying")
	.name("播放")
	.onFinishChange((v: boolean) => {
		if (v) {
			bg.resume();
		} else {
			bg.pause();
		}
	});
bgGui
	.add(debugValues, "bgFPS", 1, 60, 1)
	.name("帧率")
	.onFinishChange((v: number) => {
		bg.setFPS(v);
	});

const playerGui = gui.addFolder("音乐播放器");
const progress = playerGui
	.add(debugValues, "currentTime")
	.min(0)
	.step(1)
	.name("当前进度")
	.onChange((v: number) => {
		audio.currentTime = v;
	});
playerGui.add(debugValues, "play");

const lyricPlayer = new LyricPlayer();

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
const frame = () => {
	stats.end();
	if (!audio.paused) {
		const time = audio.currentTime | 0;
		debugValues.currentTime = time;
		progress.max(audio.duration | 0);
		progress.updateDisplay();
		lyricPlayer.setCurrentTime(time);
	}
	stats.begin();
	requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

const bg = new BackgroundRender();
bg.setFPS(30);

window.lyricPlayer = lyricPlayer;

(async () => {
	bg.getElement().style.position = "absolute";
	bg.getElement().style.top = "0";
	bg.getElement().style.left = "0";
	bg.getElement().style.width = "100%";
	bg.getElement().style.height = "100%";
	bg.setAlbumImage(debugValues.album);
	document.body.appendChild(bg.getElement());
	document.body.appendChild(lyricPlayer.getElement());
	lyricPlayer.setLyricLines(
		parseTTML(await (await fetch(debugValues.lyric)).text()),
	);
	debugValues.play();
})();

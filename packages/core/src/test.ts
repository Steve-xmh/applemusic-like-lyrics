/**
 * @fileoverview
 * 此处是一个简易的组件加载测试脚本，用来调试歌词
 *
 * @author SteveXMH
 */

import GUI from "lil-gui";
import { BackgroundRender } from "./bg-render";
import Stats from "stats.js";
import { LyricLineMouseEvent, LyricPlayer } from "./lyric-player";
import { parseTTML } from "./lyric/ttml";
import { SpringParams } from "./utils/spring";
import { parseLrc } from "@applemusic-like-lyrics/lyric";

const audio = document.createElement("audio");
audio.preload = "auto";

const debugValues = {
	lyric: new URL(location.href).searchParams.get("lyric") || "",
	music: new URL(location.href).searchParams.get("music") || "",
	album: new URL(location.href).searchParams.get("album") || "",
	enableSpring: true,
	bgFPS: 30,
	bgScale: 0.5,
	bgFlowSpeed: 2,
	bgPlaying: true,
	bgStaticMode: false,
	currentTime: 0,
	enableBlur: true,
	play() {
		audio.load();
		audio.play();
	},
	pause() {
		if (audio.paused) {
			audio.play();
		} else {
			audio.pause();
		}
	},
	lineSprings: {
		posX: {
			mass: 1,
			damping: 10,
			stiffness: 100,
			soft: false,
		} as SpringParams,
		posY: {
			mass: 1,
			damping: 15,
			stiffness: 100,
			soft: false,
		} as SpringParams,
		scale: {
			mass: 1,
			damping: 20,
			stiffness: 100,
			soft: false,
		} as SpringParams,
	},
};

audio.src = debugValues.music;
audio.load();

const gui = new GUI();
gui.close();

gui.title("AMLL 歌词测试页面");
gui
	.add(debugValues, "lyric")
	.name("歌词文件")
	.onFinishChange(async (url: string) => {
		lyricPlayer.setLyricLines(parseTTML(await (await fetch(url)).text()));
	});
gui
	.add(debugValues, "music")
	.name("歌曲")
	.onFinishChange((v: string) => {
		audio.src = v;
	});
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
	.add(debugValues, "bgScale", 0.01, 1, 0.01)
	.name("分辨率比率")
	.onChange((v: number) => {
		bg.setRenderScale(v);
	});
bgGui
	.add(debugValues, "bgFPS", 1, 60, 1)
	.name("帧率")
	.onFinishChange((v: number) => {
		bg.setFPS(v);
	});
bgGui
	.add(debugValues, "bgFlowSpeed", 0, 10, 0.1)
	.name("流动速度")
	.onFinishChange((v: number) => {
		bg.setFlowSpeed(v);
	});
bgGui
	.add(debugValues, "bgStaticMode")
	.name("静态模式")
	.onFinishChange((v: boolean) => {
		bg.setStaticMode(v);
	});

{
	const animation = gui.addFolder("歌词行动画/效果");
	animation
		.add(debugValues, "enableBlur")
		.name("启用歌词模糊")
		.onChange((v: boolean) => {
			lyricPlayer.setEnableBlur(v);
		});
	animation
		.add(debugValues, "enableSpring")
		.name("使用弹簧动画")
		.onChange((v: boolean) => {
			lyricPlayer.setEnableSpring(v);
		});
	function addSpringDbg(name: string, obj: SpringParams, onChange: () => void) {
		const x = animation.addFolder(name);
		x.close();
		x.add(obj, "mass").name("质量").onFinishChange(onChange);
		x.add(obj, "damping").name("阻力").onFinishChange(onChange);
		x.add(obj, "stiffness").name("弹性").onFinishChange(onChange);
		x.add(obj, "soft")
			.name("强制软弹簧（当阻力小于 1 时有用）")
			.onFinishChange(onChange);
	}
	addSpringDbg("水平位移弹簧", debugValues.lineSprings.posX, () => {
		lyricPlayer.setLinePosXSpringParams(debugValues.lineSprings.posX);
	});
	addSpringDbg("垂直位移弹簧", debugValues.lineSprings.posY, () => {
		lyricPlayer.setLinePosYSpringParams(debugValues.lineSprings.posY);
	});
	addSpringDbg("缩放弹簧", debugValues.lineSprings.scale, () => {
		lyricPlayer.setLineScaleSpringParams(debugValues.lineSprings.scale);
	});
}

const playerGui = gui.addFolder("音乐播放器");
const progress = playerGui
	.add(debugValues, "currentTime")
	.min(0)
	.step(1)
	.name("当前进度")
	.onChange((v: number) => {
		audio.currentTime = v;
		lyricPlayer.setCurrentTime(v * 1000, true);
	});
playerGui.add(debugValues, "play").name("加载/播放");
playerGui.add(debugValues, "pause").name("暂停/继续");

const lyricPlayer = new LyricPlayer();

lyricPlayer.addEventListener("line-click", (evt) => {
	const e = evt as LyricLineMouseEvent;
	evt.preventDefault();
	evt.stopImmediatePropagation();
	evt.stopPropagation();
	console.log(e.line, e.lineIndex);
});

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
let lastTime = -1;
const frame = (time: number) => {
	stats.end();
	if (lastTime === -1) {
		lastTime = time;
	}
	if (!audio.paused) {
		const time = (audio.currentTime * 1000) | 0;
		debugValues.currentTime = (time / 1000) | 0;
		progress.max(audio.duration | 0);
		progress.updateDisplay();
		lyricPlayer.setCurrentTime(time);
	}
	lyricPlayer.update(time - lastTime);
	lastTime = time;
	stats.begin();
	requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

const bg = new BackgroundRender();
bg.setFPS(30);

declare global {
	interface Window {
		globalLyricPlayer: LyricPlayer;
	}
}

window.globalLyricPlayer = lyricPlayer;

async function loadLyric() {
	const lyricFile = debugValues.lyric;
	const content = await (await fetch(lyricFile)).text();
	if (lyricFile.endsWith(".ttml")) {
		lyricPlayer.setLyricLines(parseTTML(content));
	} else if (lyricFile.endsWith(".lrc")) {
		lyricPlayer.setLyricLines(
			parseLrc(content).map((line, i, lines) => ({
				words: [
					{
						word: line.words[0]?.word ?? "",
						startTime: line.words[0]?.startTime ?? 0,
						endTime: lines[i + 1]?.words?.[0]?.startTime ?? Infinity,
					},
				],
				startTime: line.words[0]?.startTime ?? 0,
				endTime: lines[i + 1]?.words?.[0]?.startTime ?? Infinity,
				translatedLyric: "",
				romanLyric: "",
				isBG: false,
				isDuet: false,
			})),
		);
	}
}

(async () => {
	bg.getElement().style.position = "absolute";
	bg.getElement().style.top = "0";
	bg.getElement().style.left = "0";
	bg.getElement().style.width = "100%";
	bg.getElement().style.height = "100%";
	bg.setAlbumImage(debugValues.album);
	audio.style.display = "none";
	lyricPlayer.getBottomLineElement().innerHTML = "Test Bottom Line";
	const player = document.getElementById("player");
	if (player) {
		player.appendChild(audio);
		player.appendChild(bg.getElement());
		player.appendChild(lyricPlayer.getElement());
	}
	await loadLyric();
	debugValues.play();
})();

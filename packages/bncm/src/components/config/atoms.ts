import manifest from "virtual:bncm-plugin-manifest";
import { PlayControlButtonType } from "../song-info/play-control-button";
import { atomWithConfig } from "./atom-with-config";
import {
	LYRIC_SOURCE_UUID_BUILTIN_AMLL_TTML_DB,
	LYRIC_SOURCE_UUID_BUILTIN_NCM,
	LyricFormat,
	type LyricSource,
} from "../../lyric/source";

export const updateBranchAtom = atomWithConfig({
	key: "update-branch",
	default: manifest.branch,
	desc: "更新插件所对应检查的分支名称，main 为主分支版本",
});

export const enableUpdateBranchAtom = atomWithConfig({
	key: "enable-update-branch",
	default: false,
	desc: "是否检查其他分支更新",
});

export const enableUpdateCheckAtom = atomWithConfig({
	key: "update-check",
	default: false,
	desc: "是否在每次启动插件时检查插件更新",
});

export const showAudioQualityTagAtom = atomWithConfig({
	key: "show-audio-quality-tag",
	default: true,
	desc: "是否显示音质标签",
});

export const playPositionOffsetAtom = atomWithConfig({
	key: "play-position-offset",
	loadable: true,
	default: 0,
	desc: "全局播放时间偏移，单位毫秒，正数提前，负数推迟",
});

export const showAlbumImageAtom = atomWithConfig({
	key: "show-album-image",
	default: true,
	desc: "显示专辑图片",
});

export const showMusicNameAtom = atomWithConfig({
	key: "show-music-name",
	default: true,
	desc: "显示歌曲名称",
});

export const showAlbumNameAtom = atomWithConfig({
	key: "show-album-name",
	default: false,
	desc: "显示专辑名称",
});

export const showMusicArtistsAtom = atomWithConfig({
	key: "show-music-artists",
	default: true,
	desc: "显示歌手名称",
});

export const showMenuButtonAtom = atomWithConfig({
	key: "show-menu-button",
	default: true,
	desc: "显示菜单按钮",
});

export const showControlThumbAtom = atomWithConfig({
	key: "show-control-thumb",
	default: true,
	desc: "显示控制横条",
});

export const showAMLLTTMLDBTipAtom = atomWithConfig({
	key: "show-amll-ttml-db-tip",
	default: true,
	desc: "是否在歌词底部显示歌词来自 AMLL TTML DB（如果正在使用）",
});

export const leftControlButtonTypeAtom = atomWithConfig({
	key: "left-control-button-type",
	default: PlayControlButtonType.PlaybackRandom,
	desc: "当使用播放控制栏时，左侧的按钮操作类型",
});

export const rightControlButtonTypeAtom = atomWithConfig({
	key: "right-control-button-type",
	default: PlayControlButtonType.PlaybackRepeat,
	desc: "当使用播放控制栏时，右侧的按钮操作类型",
});

export const showTranslatedLineAtom = atomWithConfig({
	key: "show-translated-line",
	default: true,
	desc: "是否显示翻译歌词行",
});
export const showRomanLineAtom = atomWithConfig({
	key: "show-roman-line",
	default: true,
	desc: "是否显示音译歌词行",
});

export const swapTranslatedRomanLineAtom = atomWithConfig({
	key: "swap-trans-roman-line",
	default: false,
	desc: "是否交换翻译行和音译行的位置",
});

export const lyricWordFadeWidthAtom = atomWithConfig({
	key: "lyric-word-fade-width",
	default: 0.5,
	desc: "单词的渐变宽度",
});

export const lyricAdvanceDynamicLyricTimeAtom = atomWithConfig({
	key: "lyric-advance-dynamic-lyric-time",
	default: true,
	desc: "是否应用提前歌词行时序",
});
export const lyricBlurEffectAtom = atomWithConfig({
	key: "lyric-blur-effect",
	default: true,
	desc: "是否应用歌词行的模糊效果",
});
export const lyricScaleEffectAtom = atomWithConfig({
	key: "lyric-scale-effect",
	default: true,
	desc: "是否应用歌词行的缩放效果",
});
export const lyricSpringEffectAtom = atomWithConfig({
	key: "lyric-spring-effect",
	default: true,
	desc: "是否使用物理弹簧动画效果于歌词行上",
});

export const lyricHidePassedAtom = atomWithConfig({
	key: "lyric-hide-passed",
	default: false,
	desc: "是否隐藏当前进度之后播放完成的歌词行，而不是降低不透明度",
});

export const fontColorAtom = atomWithConfig({
	key: "font-color",
	default: "#FFFFFF",
	desc: "字体颜色",
});

export const primaryColorAtom = atomWithConfig({
	key: "primary-color-color",
	default: "#FFFFFF",
	desc: "控件主要颜色",
});

export const neverGonnaGiveYouUpAtom = atomWithConfig({
	key: "never-gonna-give-you-up",
	default: false,
	desc: "不再显示开发警告",
	loadable: true,
});

export const showTutoialAtom = atomWithConfig({
	key: "show-tutoial",
	default: true,
	desc: "显示使用教程",
	loadable: true,
});

export const hideCursorWhenHoveringCoverAtom = atomWithConfig({
	key: "hide-cursor-when-hovering-cover",
	default: false,
	desc: "当光标悬浮在封面上时隐藏指针",
});

export const keepBuiltinPlayerWhenConnectedAtom = atomWithConfig({
	key: "keep-builtin-player-when-connected",
	default: false,
	desc: "歌词播放器连接时保持启用内嵌歌词页面",
});

export const usePlayPositionLerpAtom = atomWithConfig({
	key: "use-play-position-lerp",
	default: false,
	desc: "是否使用插值平滑播放进度，本选项在 macOS 会强制启用",
});

export const autoOpenLyricPageAtom = atomWithConfig({
	key: "auto-open-lyric-page",
	default: false,
	desc: "是否在插件加载完成后自动打开歌词页面",
	loadable: true,
});

export const pauseWhenMusicLoadedAtom = atomWithConfig({
	key: "pause-when-music-loaded",
	default: false,
	desc: "是否在播放上下文接收到音乐加载的事件后立刻暂停播放",
});

export const showStatsAtom = atomWithConfig({
	key: "show-stats",
	default: false,
	desc: "显示实时帧数统计数据",
});

export const disableMixBlendModeAtom = atomWithConfig({
	key: "disable-mix-blend-mode",
	default: false,
	desc: "禁用高亮混色模式",
});

export const showBackgroundFFTLowFreqAtom = atomWithConfig({
	key: "show-background-fft-low-freq",
	default: false,
	desc: "显示实时背景音频状态数据",
});

export const forceHasLyricsBackgroundAtom = atomWithConfig({
	key: "force-has-lyrics-background",
	default: false,
	desc: "强制进入有歌词样式背景",
});

export const enableWSPlayer = atomWithConfig({
	key: "enable-ws-player",
	default: false,
	desc: "是否启用歌词播放器连接",
});
export const wsPlayerURL = atomWithConfig({
	key: "ws-player-url",
	default: "ws://localhost:11444",
	desc: "将会连接到的歌词播放器的地址",
});

export const enableBackgroundAtom = atomWithConfig({
	key: "enable-background",
	default: true,
	desc: "是否启用歌词背景",
});

export enum BackgroundType {
	LiquidEplor = "liquid-eplor",
	MeshLiquid = "mesh-liquid",
	NewLiquidEplor = "new-liquid-eplor",
	FakeLiquid = "fake-liquid",
	NewLiquidEplorTest = "new-liquid-eplor-test",
	CustomSolidColor = "custom-solid-color",
}

export const backgroundTypeAtom = atomWithConfig({
	key: "background-type",
	default: BackgroundType.LiquidEplor,
	desc: "背景类型",
});

export const backgroundStaticModeAtom = atomWithConfig({
	key: "background-static-mode",
	default: false,
	desc: "动态背景通用设置 - 静态背景模式",
});

export const backgroundMaxFPSAtom = atomWithConfig({
	key: "background-max-fps",
	default: 30,
	desc: "动态背景通用设置 - 最大 FPS",
});

export const backgroundRenderScaleAtom = atomWithConfig({
	key: "background-render-scale",
	default: 0.5,
	desc: "动态背景通用设置 - 渲染精度",
});

export const backgroundFlowSpeedAtom = atomWithConfig({
	key: "background-flow-speed",
	default: 2,
	desc: "动态背景通用设置 - 动画速度",
});

export const backgroundCustomSolidColorAtom = atomWithConfig({
	key: "background-custom-solid-color",
	default: "#222222",
	desc: "自定义纯颜色背景下的背景颜色",
});

export const lyricSourcesAtom = atomWithConfig<LyricSource[]>({
	key: "lyric-sources",
	default: [
		{
			type: "builtin:amll-ttml-db",
			id: LYRIC_SOURCE_UUID_BUILTIN_AMLL_TTML_DB,
			url: "",
			website: "https://github.com/Steve-xmh/amll-ttml-db",
			desc: "内置歌词源，会寻找来自 AMLL TTML 歌词数据库的逐词歌词",
			format: LyricFormat.TTML,
		},
		{
			type: "builtin:ncm",
			id: LYRIC_SOURCE_UUID_BUILTIN_NCM,
			url: "",
			desc: "内置歌词源，会寻找来自网易云的歌词",
			format: LyricFormat.YRC,
		},
	],
	desc: "歌词源清单，在加载歌词时将会从头开始依次尝试寻找歌词",
});

export const cacheLyricAtom = atomWithConfig({
	key: "cache-lyric",
	default: true,
	desc: "是否缓存歌词文件以便快速读取",
});

export enum MusicControlType {
	None = "none",
	Default = "default",
	BarVisualizer = "bar-visualizer",
}

export const musicControlTypeAtom = atomWithConfig({
	key: "music-control-type",
	default: MusicControlType.Default,
	desc: "音乐控制组件的类型",
});

export const showVolumeSliderAtom = atomWithConfig({
	key: "show-colume-slider-type",
	default: true,
	desc: "是否显示音量控制条",
});

export const processBarFFTAtom = atomWithConfig({
	key: "process-bar-fft",
	default: true,
	desc: "是否进行可视化动画频谱数据的后处理以更适合观赏",
});

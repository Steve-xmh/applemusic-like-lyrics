
export const defaultAMLLConfig = {
	/** 更新插件所对应检查的分支名称，main 为主分支版本 */
	updateBranch: 0,
	/** 是否检查其他分支更新 */
	enableUpdateBranch: false,
	/** 是否在每次启动插件时检查插件更新 */
	updateCheck: false,
	/** 是否显示音质标签 */
	showAudioQualityTag: true,
	/** 全局播放时间偏移，单位毫秒，正数提前，负数推迟 */
	playPositionOffset: 0,
	/** 显示专辑图片 */
	showAlbumImage: true,
	/** 显示歌曲名称 */
	showMusicName: true,
	/** 显示专辑名称 */
	showAlbumName: false,
	/** 显示歌手名称 */
	showMusicArtists: true,
	/** 显示菜单按钮 */
	showMenuButton: true,
	/** 显示控制横条 */
	showControlThumb: true,
	/** 是否在歌词底部显示歌词来自 AMLL TTML DB（如果正在使用） */
	showAmllTtmlDbTip: true,
	/** 当使用播放控制栏时，左侧的按钮操作类型 */
	leftControlButtonType: "playback-type-random",
	/** 当使用播放控制栏时，右侧的按钮操作类型 */
	rightControlButtonType: "playback-type-loop",
	/** 是否显示翻译歌词行 */
	showTranslatedLine: true,
	/** 是否显示音译歌词行 */
	showRomanLine: true,
	/** 是否交换翻译行和音译行的位置 */
	swapTransRomanLine: false,
	/** 单词的渐变宽度 */
	lyricWordFadeWidth: 0.5,
	/** 是否应用提前歌词行时序 */
	lyricAdvanceDynamicLyricTime: true,
	/** 是否应用歌词行的模糊效果 */
	lyricBlurEffect: true,
	/** 是否应用歌词行的缩放效果 */
	lyricScaleEffect: true,
	/** 是否使用物理弹簧动画效果于歌词行上 */
	lyricSpringEffect: true,
	/** 是否隐藏当前进度之后播放完成的歌词行，而不是降低不透明度 */
	lyricHidePassed: false,
	/** 字体颜色 */
	fontColor: "#FFFFFF",
	/** 控件主要颜色 */
	primaryColorColor: "#FFFFFF",
	/** 当光标悬浮在封面上时隐藏指针 */
	hideCursorWhenHoveringCover: false,
	/** 歌词播放器连接时保持启用内嵌歌词页面 */
	keepBuiltinPlayerWhenConnected: false,
	/** 是否使用插值平滑播放进度，本选项在 macOS 会强制启用 */
	usePlayPositionLerp: false,
	/** 是否在插件加载完成后自动打开歌词页面 */
	autoOpenLyricPage: false,
	/** 是否在播放上下文接收到音乐加载的事件后立刻暂停播放 */
	pauseWhenMusicLoaded: false,
	/** 显示实时帧数统计数据 */
	showStats: false,
	/** 禁用高亮混色模式 */
	disableMixBlendMode: false,
	/** 显示实时背景音频状态数据 */
	showBackgroundFftLowFreq: false,
	/** 是否启用歌词播放器连接 */
	enableWsPlayer: false,
	/** 将会连接到的歌词播放器的地址 */
	wsPlayerUrl: "ws://localhost:11444",
	/** 是否启用歌词背景 */
	enableBackground: true,
	/** 背景类型 */
	backgroundType: "liquid-eplor",
	/** 动态背景通用设置 - 静态背景模式 */
	backgroundStaticMode: false,
	/** 动态背景通用设置 - 最大 FPS */
	backgroundMaxFps: 30,
	/** 动态背景通用设置 - 渲染精度 */
	backgroundRenderScale: 0.5,
	/** 动态背景通用设置 - 动画速度 */
	backgroundFlowSpeed: 2,
	/** 自定义纯颜色背景下的背景颜色 */
	backgroundCustomSolidColor: "#222222",
	/** 歌词源清单，在加载歌词时将会从头开始依次尝试寻找歌词 */
	lyricSources: [
		{
			type: "builtin:amll-ttml-db",
			id: "4fb49490-2acc-41bf-b59a-f68aa88f4f66",
			url: "",
			website: "https://github.com/Steve-xmh/amll-ttml-db",
			desc: "内置歌词源，会寻找来自 AMLL TTML 歌词数据库的逐词歌词",
			format: "ttml",
		},
		{
			type: "builtin:ncm",
			id: "578b6b81-b723-43c5-a9f6-d5fbbcc1d07b",
			url: "",
			desc: "内置歌词源，会寻找来自网易云的歌词",
			format: "yrc",
		},
	],
	/** 是否缓存歌词文件以便快速读取 */
	cacheLyric: true,
	/** 音乐控制组件的类型 */
	musicControlType: "default",
	/** 是否显示音量控制条 */
	showColumeSliderType: true,
	/** 是否进行可视化动画频谱数据的后处理以更适合观赏 */
	processBarFft: true,
};

export type AMLLConfig = typeof defaultAMLLConfig;

export interface DynamicLyricWord {
	time: number;
	duration: number;
	flag: number;
	word: string;
}

export interface LyricLine extends BackgroundLyricLine {
	beginTime: number;
	duration: number;
	shouldAlignRight?: boolean;
	backgroundLyric?: LyricLine;
}

export interface BackgroundLyricLine {
	originalLyric: string;
	translatedLyric?: string;
	romanLyric?: string;
	dynamicLyricTime?: number;
	isBackgroundLyric?: boolean;
	dynamicLyric?: DynamicLyricWord[];
}

export interface LyricPureLine {
	time: number;
	lyric: string;
}

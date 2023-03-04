export interface DynamicLyricWord {
	time: number;
	duration: number;
	flag: number;
	word: string;
}

export interface LyricLine extends BackgroundLyricLine {
	beginTime: number;
	duration: number;
	backgroundLyric?: BackgroundLyricLine;
	shouldAlignRight?: boolean;
}

export interface BackgroundLyricLine {
	originalLyric: string;
	translatedLyric?: string;
	romanLyric?: string;
	dynamicLyricTime?: number;
	dynamicLyric?: DynamicLyricWord[];
}

export interface LyricPureLine {
	time: number;
	lyric: string;
}

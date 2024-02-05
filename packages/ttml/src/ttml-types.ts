export interface TTMLMetadata {
	key: string;
	value: string[];
}

export interface TTMLLyric {
	metadata: TTMLMetadata[];
	lyricLines: LyricLine[];
}

export interface LyricWord {
	startTime: number;
	endTime: number;
	word: string;
	emptyBeat?: number;
}

export interface LyricLine {
	words: LyricWord[];
	translatedLyric: string;
	romanLyric: string;
	isBG: boolean;
	isDuet: boolean;
	startTime: number;
	endTime: number;
}

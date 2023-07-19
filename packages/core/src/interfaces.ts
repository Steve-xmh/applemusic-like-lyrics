/**
 * 拥有一个 HTML 元素的接口
 *
 * 可以通过 `getElement` 获取这个类所对应的 HTML 元素实例
 */
export interface HasElement {
	/** 获取这个类所对应的 HTML 元素实例 */
	getElement(): HTMLElement;
}

/**
 * 实现了这个接口的东西需要在使用完毕后
 *
 * 手动调用 `dispose` 函数来销毁清除占用资源
 *
 * 以免产生泄露
 */
export interface Disposable {
	/**
	 * 销毁实现了该接口的对象实例，释放占用的资源
	 *
	 * 一般情况下，调用本函数后就不可以再调用对象的任何函数了
	 */
	dispose(): void;
}

/** 一个歌词单词 */
export interface LyricWord {
	/** 单词的起始时间 */
	startTime: number;
	/** 单词的结束时间 */
	endTime: number;
	/** 单词 */
	word: string;
}

/** 一行歌词，存储多个单词 */
export interface LyricLine {
	/**
	 * 该行的所有单词
	 * 如果是 LyRiC 等只能表达一行歌词的格式，这里就只会有一个单词
	 */
	words: LyricWord[];
	translatedLyric: string;
	romanLyric: string;
	/** 句子的起始时间 */
	startTime: number;
	/** 句子的结束时间 */
	endTime: number;
	/** 该行是否为背景歌词行 */
	isBG: boolean;
	/** 该行是否为对唱歌词行（即歌词行靠右对齐） */
	isDuet: boolean;
}

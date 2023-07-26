/**
 * @fileoverview
 * 用于以一个统一的接口来获取相关的音乐播放信息，并提供一些事件的回调操作
 */

import { TypedEventTarget } from "typescript-event-target";

/**
 * 音乐播放信息获取器的抽象
 *
 * 可以通过挂载部分事件来获得当前播放状态
 */
export abstract class MusicStatusGetterBase extends TypedEventTarget<MusicStatusGetterEvents> {
	abstract getMusicId(): string;
	abstract getMusicName(): string;
	abstract getMusicArtists(): string;
}

export interface MusicStatusGetterEvents {
	/**
	 * 当音乐被加载时触发
	 *
	 * 此时应当可以获取被加载的音乐信息
	 */
	load: Event;
	/**
	 * 当音乐被卸载时触发
	 *
	 * 此时一般处于将要切歌或播放完毕的状态
	 */
	unload: Event;
	/**
	 * 当音乐恢复播放时触发
	 */
	resume: Event;
	/**
	 * 当音乐暂停播放时触发
	 */
	pause: Event;
	/**
	 * 当当前播放进度发生变化时触发
	 *
	 * 在 Windows 上，这个的触发频率在 60hz 左右
	 *
	 * 在 macOS 上，这个的触发频率在 2hz 左右
	 *
	 * @todo 是否考虑统一触发频率
	 */
	progress: CustomEvent<{
		/**
		 * 当前播放进度
		 */
		progress: number;
	}>;
}

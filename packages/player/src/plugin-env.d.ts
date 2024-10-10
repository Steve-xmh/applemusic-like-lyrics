import type * as amllStates from "@applemusic-like-lyrics/react-full";
import type { Atom } from "jotai";
import type * as playerStates from "./states";
export * as React from "react";
export * as ReactDOM from "react-dom";

type PlayerStatesExports = typeof playerStates;
type AMLLStatesExports = typeof amllStates;
type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

declare type PlayerStates = OmitNever<{
	[K in keyof PlayerStatesExports]: PlayerStatesExports[K] extends Atom<any>
		? readonly PlayerStatesExports[K]
		: never;
}>;
declare type AMLLStates = OmitNever<{
	[K in keyof AMLLStatesExports]: AMLLStatesExports[K] extends Atom<any>
		? readonly AMLLStatesExports[K]
		: never;
}>;

/**
 * 当前插件的上下文结构
 */
declare interface PluginContext {
	/**
	 * 声明本插件需要依赖的插件 ID，将会保证调用本函数后依赖的插件已经加载完成
	 * @param pluginId 插件的 ID
	 */
	dependency(pluginId: name): Promise<void>;
	/**
	 * 注册一个音频源，由插件提供的音频源
	 * @param idPrefix 音频 ID 的前缀，作为识别插件歌曲源的唯一标识
	 */
	registerPlayerSource(idPrefix: string): void;
	/**
	 * 播放器本身的各个状态，考虑到数据竞争问题，不建议直接修改状态的值
	 */
	playerStates: readonly PlayerStates;
	/**
	 * 歌词组件的各个状态，考虑到数据竞争问题，不建议直接修改状态的值
	 */
	amllStates: readonly AMLLStates;
}

/**
 * 当前插件的上下文，在插件的整个生命周期中都可以访问
 */
declare const pluginContext: PlayerStates;

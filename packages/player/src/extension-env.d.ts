import type * as amllStates from "@applemusic-like-lyrics/react-full";
import type { i18n } from "i18next";
import type { Atom, createStore } from "jotai";
import type { ComponentType } from "react";
import type { db } from "./dexie";
import type * as playerStates from "./states";

export type * as RadixTheme from "@radix-ui/themes";
export type * as Jotai from "jotai";
export type * as React from "react";
export type * as ReactDOM from "react-dom";

type PlayerStatesExports = typeof playerStates;
type AMLLStatesExports = typeof amllStates;
type OmitNever<T> = { [K in keyof T as T[K] extends never ? never : K]: T[K] };

declare type PlayerStates = OmitNever<{
	[K in keyof PlayerStatesExports]: PlayerStatesExports[K] extends Atom<unknown>
		? PlayerStatesExports[K]
		: never;
}>;
declare type AMLLStates = OmitNever<{
	[K in keyof AMLLStatesExports]: AMLLStatesExports[K] extends Atom<unknown>
		? AMLLStatesExports[K]
		: never;
}>;

declare interface AnySongData {
	type: string;
}

declare interface LocalSongData extends AnySongData {
	type: "local";
	filePath: string;
}

declare interface NetworkSongData extends AnySongData {
	type: "network";
	url: string;
	headers?: Record<string, string>;
}

declare interface ExtensionContextEventMap {
	/**
	 * 当所有扩展程序都完成了初步脚本加载的操作时触发
	 *
	 * 此回调是扩展程序生命周期中第一个被调用的函数
	 */
	"extension-load": Event;
	/**
	 * 当扩展程序被卸载加载时触发，扩展程序作者可以在此销毁扩展程序资源
	 *
	 * ~~其实考虑到播放器的实际情况可能这个事件永远不会被触发~~
	 *
	 * 此回调是扩展程序生命周期中最后一个被调用的函数
	 */
	"extension-unload": Event;
}

/**
 * 当前扩展程序的上下文结构
 */
declare interface ExtensionContext extends EventTarget {
	/**
	 * 扩展程序接口的版本号，会随着扩展接口更新而递增数字
	 */
	extensionApiNumber: readonly number;
	jotaiStore: ReturnType<typeof createStore>;
	/**
	 * 将扩展程序的本地化字段数据注册到 AMLL Player 的国际化上下文中
	 * 以此为扩展程序的文字提供国际化能力
	 * @param localeData 本地化文字数据
	 */
	registerLocale<T>(localeData: { [langId: string]: T }): void;
	/**
	 * 在任何记载过的需要过的组件注入点中注入自定义 React 组件
	 *
	 * 必须在初始化阶段或事件 `extension-load` 触发时调用注册，否则组件将不能正确创建显示出来
	 *
	 * 常用的注入点有如下：
	 * - `settings`: 扩展程序独有设置的区域
	 * - `context`: 应用的上下文区域，与各种上下文同级
	 * - `head`: 应用的 Head 元素区域，可以用于添加 `style` 样式
	 *
	 * @param injectPointName 需要注入到的注入点名称
	 * @param injectComponent 需要注入的 React 组件类
	 */
	registerComponent(
		injectPointName: string,
		injectComponent: ComponentType,
	): void;
	/**
	 * 注册一个音频源
	 *
	 * 当 AMLL Player 切换到扩展程序提供的歌曲源后，将会让出播放控制权给扩展程序
	 *
	 * 届时扩展程序可以自由控制设置播放状态
	 *
	 * @param idPrefix 音频 ID 的前缀，作为识别扩展程序歌曲源的唯一标识
	 */
	registerPlayerSource(idPrefix: string): void;
	/**
	 * 播放器本身的各个状态，考虑到数据竞争问题，在文档注释中没有明确提及可以修改的内容和时机时不建议直接修改状态的值
	 */
	playerStates: Readonly<PlayerStates>;
	/**
	 * 歌词组件的各个状态，任何时候均可读取，但只建议在当前正在播放扩展程序提供的歌曲源时设置其状态
	 */
	amllStates: Readonly<AMLLStates>;
	/**
	 * 开箱即用的歌词解析模块，详情可参考 `@applemusic-like-lyrics/lyric`
	 */
	lyric: import("@applemusic-like-lyrics/lyric");
	/**
	 * 播放器的数据库对象，内有存储播放列表，歌曲曲目，TTML DB 歌词等数据
	 */
	playerDB: typeof db;
	/**
	 * 用于本地化扩展程序显示内容的工具
	 */
	i18n: i18n;

	addEventListener<T extends keyof ExtensionContextEventMap>(
		type: T,
		callback: EventListenerOrEventListenerObject | null,
		options?: AddEventListenerOptions | boolean,
	): void;

	removeEventListener<T extends keyof ExtensionContextEventMap>(
		type: T,
		callback: EventListenerOrEventListenerObject | null,
		options?: AddEventListenerOptions | boolean,
	): void;
}

export type {
	AMLLStates,
	AnySongData,
	ExtensionContext,
	ExtensionContextEventMap,
	LocalSongData,
	NetworkSongData,
	PlayerStates,
};

declare global {
	namespace globalThis {
		/**
		 * 当前扩展程序的上下文，在扩展程序的整个生命周期中都可以访问，同时也是整个扩展程序的 `this` 属性
		 */
		declare const extensionContext: Readonly<ExtensionContext>;

		// AMLL Player 暴露的常用模块
		declare const React: typeof import("react");
		declare const ReactDOM: typeof import("react-dom");
		declare const Jotai: typeof import("jotai");
		declare const RadixTheme: typeof import("@radix-ui/themes");
	}
}

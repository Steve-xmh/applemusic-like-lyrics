import type * as amllStates from "@applemusic-like-lyrics/react-full";
import type { i18n } from "i18next";
import type { Atom, createStore } from "jotai";
import type { ComponentType } from "react";
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

declare interface PluginContextEventMap {
	/**
	 * 当所有插件都完成了初步脚本加载的操作时触发
	 *
	 * 此回调是插件生命周期中第一个被调用的函数
	 */
	"plugin-load": Event;
	/**
	 * 当插件被卸载加载时触发，插件作者可以在此销毁插件资源
	 *
	 * ~~其实考虑到播放器的实际情况可能这个事件永远不会被触发~~
	 *
	 * 此回调是插件生命周期中最后一个被调用的函数
	 */
	"plugin-unload": Event;
}

/**
 * 当前插件的上下文结构
 */
declare interface PluginContext extends EventTarget {
	jotaiStore: ReturnType<typeof createStore>;
	/**
	 * 将插件的本地化字段数据注册到 AMLL Player 的国际化上下文中
	 * 以此为插件的文字提供国际化能力
	 * @param localeData 本地化文字数据
	 */
	registerLocale<T>(localeData: { [langId: string]: T }): void;
	/**
	 * 注册插件的设置板块页面，如果调用本函数，将会在设置页面的侧栏显示本插件的图标按钮，点击后可以访问到插件设置
	 *
	 * 本函数只允许在 `plugin-init` 事件回调内被调用，如无需求可以不调用
	 *
	 * @param settingComponent 需要成为插件设置的 React 组件类
	 */
	registerSettingPage(settingComponent: ComponentType): void;
	/**
	 * 注册一个音频源
	 *
	 * 当 AMLL Player 切换到插件提供的歌曲源后，将会让出播放控制权给插件
	 *
	 * 届时插件可以自由控制设置播放状态
	 *
	 * @param idPrefix 音频 ID 的前缀，作为识别插件歌曲源的唯一标识
	 */
	registerPlayerSource(idPrefix: string): void;
	/**
	 * 播放器本身的各个状态，考虑到数据竞争问题，在文档注释中没有明确提及可以修改的内容和时机时不建议直接修改状态的值
	 */
	playerStates: Readonly<PlayerStates>;
	/**
	 * 歌词组件的各个状态，任何时候均可读取，但只建议在当前正在播放插件提供的歌曲源时设置其状态
	 */
	amllStates: Readonly<AMLLStates>;
	/**
	 *
	 */
	i18n: i18n;

	addEventListener<T extends keyof PluginContextEventMap>(
		type: T,
		callback: EventListenerOrEventListenerObject | null,
		options?: AddEventListenerOptions | boolean,
	): void;

	removeEventListener<T extends keyof PluginContextEventMap>(
		type: T,
		callback: EventListenerOrEventListenerObject | null,
		options?: AddEventListenerOptions | boolean,
	): void;
}

export type {
	AMLLStates,
	AnySongData,
	LocalSongData,
	NetworkSongData,
	PlayerStates,
	PluginContext,
	PluginContextEventMap,
};

declare global {
	namespace globalThis {
		/**
		 * 当前插件的上下文，在插件的整个生命周期中都可以访问，同时也是整个插件的 `this` 属性
		 */
		declare const pluginContext: Readonly<PluginContext>;
	}
}

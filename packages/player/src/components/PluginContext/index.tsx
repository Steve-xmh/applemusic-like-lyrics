import * as AMLLStates from "@applemusic-like-lyrics/react-full/states";
import { fromObject, fromSource, removeComments } from "convert-source-map";
import { useStore } from "jotai";
import { type ComponentType, type FC, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SourceMapConsumer, SourceMapGenerator } from "source-map-js";
import { uid } from "uid";
import i18n from "../../i18n";
import type PluginEnv from "../../plugin-env";
import * as PlayerStates from "../../states";
import {
	type LoadedPlugin,
	PluginLoadResult,
	type PluginMetaState,
	loadedPluginsAtom,
	pluginMetaAtom,
} from "../../states/plugin";

async function sourceMapOffsetLines(
	code: string,
	sourceRoot: string,
	lineOffset: number,
): Promise<[string, string]> {
	const incomingSourceConv = fromSource(code);
	if (!incomingSourceConv) return [code, ""];
	const incomingSourceMap = incomingSourceConv.toObject();
	const consumer = await new SourceMapConsumer(incomingSourceMap);
	const generator = new SourceMapGenerator({
		file: incomingSourceMap.file,
		sourceRoot: sourceRoot,
	});
	consumer.eachMapping((m) => {
		// skip invalid (not-connected) mapping
		// refs: https://github.com/mozilla/source-map/blob/182f4459415de309667845af2b05716fcf9c59ad/lib/source-map-generator.js#L268-L275
		if (
			typeof m.originalLine === "number" &&
			0 < m.originalLine &&
			typeof m.originalColumn === "number" &&
			0 <= m.originalColumn &&
			m.source
		) {
			generator.addMapping({
				source:
					m.source &&
					`${location.origin}/plugins/${sourceRoot}/${m.source.replace(/^(\.*\/)+/, "")}`,
				name: m.name,
				original: { line: m.originalLine, column: m.originalColumn },
				generated: {
					line: m.generatedLine + lineOffset,
					column: m.generatedColumn,
				},
			});
		}
	});
	const outgoingSourceMap = JSON.parse(generator.toString());
	if (typeof incomingSourceMap.sourcesContent !== "undefined") {
		outgoingSourceMap.sourcesContent = incomingSourceMap.sourcesContent;
	}
	return [removeComments(code), fromObject(outgoingSourceMap).toComment()];
}

export class PlayerPluginContext
	extends EventTarget
	implements PluginEnv.PluginContext
{
	/**
	 * @internal
	 */
	settingComponent?: ComponentType;
	constructor(
		readonly playerStates: PluginEnv.PluginContext["playerStates"],
		readonly amllStates: PluginEnv.PluginContext["amllStates"],
		readonly i18n: PluginEnv.PluginContext["i18n"],
		readonly jotaiStore: PluginEnv.PluginContext["jotaiStore"],
		readonly pluginMeta: Readonly<PluginMetaState>,
	) {
		super();
	}
	registerLocale<T>(localeData: { [langId: string]: T }) {
		for (const [lng, data] of Object.entries(localeData)) {
			i18n.addResourceBundle(lng, this.pluginMeta.id, data);
		}
	}
	registerSettingPage(settingComponent: ComponentType) {
		this.settingComponent = settingComponent;
	}
	registerPlayerSource(_idPrefix: string) {
		console.warn("Unimplemented");
	}
}

export const PluginContext: FC = () => {
	const { i18n } = useTranslation();
	const store = useStore();

	useEffect(() => {
		const loadedPlugins: LoadedPlugin[] = [];
		const pluginsLoadPromise = (async () => {
			const pluginMetas = await store.get(pluginMetaAtom);

			const pluginLoadedPromiseMap = new Map<string, Promise<void>>();
			const AsyncFunction: FunctionConstructor =
				// biome-ignore lint/complexity/useArrowFunction: 需要用来创建异步函数的构造函数
				Object.getPrototypeOf(async function () {}).constructor;
			const amllStates = Object.fromEntries(Object.entries(AMLLStates));
			const playerStates = Object.fromEntries(Object.entries(PlayerStates));

			async function waitForDependency(pluginId: string) {
				if (pluginLoadedPromiseMap.has(pluginId)) {
					await pluginLoadedPromiseMap.get(pluginId);
				} else {
					throw new Error(`Missing Dependency: ${pluginId}`);
				}
			}

			const pluginScripts: (() => Promise<void>)[] = [];

			for (const pluginMeta of pluginMetas) {
				if (pluginMeta.loadResult !== PluginLoadResult.Success) continue;

				const genFuncName = () => `__amll_internal_${uid()}`;
				const resolveFuncName = genFuncName();
				const rejectFuncName = genFuncName();
				const waitForDependencyFuncName = genFuncName();
				const wrapperScript: string[] = [];
				wrapperScript.push("try {");

				for (const dependencyId of pluginMeta.dependency) {
					wrapperScript.push(
						`await ${waitForDependencyFuncName}(${JSON.stringify(dependencyId)})`,
					);
				}

				let comment = "";
				const offsetLines = wrapperScript.length + 2;

				try {
					// 修正源映射表的行数，方便调试
					const [code, sourceMapComment] = await sourceMapOffsetLines(
						pluginMeta.scriptData,
						pluginMeta.id,
						offsetLines,
					);
					wrapperScript.push(code);
					comment = sourceMapComment;
				} catch (err) {
					console.log("无法转换源映射表，可能是插件并不包含源映射表", err);
					wrapperScript.push(pluginMeta.scriptData);
				}

				wrapperScript.push(`${resolveFuncName}();`);
				wrapperScript.push("} catch (err) {");
				wrapperScript.push(`${rejectFuncName}(err);`);
				wrapperScript.push("}");
				wrapperScript.push(comment);

				const loadedPluginPromise = new Promise<void>((resolve, reject) => {
					const context = new PlayerPluginContext(
						Object.freeze(Object.assign({}, playerStates)),
						Object.freeze(Object.assign({}, amllStates)),
						i18n.cloneInstance({
							ns: pluginMeta.id,
						}),
						store,
						pluginMeta,
					);

					const pluginFunc = new AsyncFunction(
						"pluginContext",
						resolveFuncName,
						rejectFuncName,
						waitForDependencyFuncName,
						wrapperScript.join("\n"),
					).bind(context, context, resolve, reject, waitForDependency);

					pluginScripts.push(pluginFunc);
					loadedPlugins.push({
						pluginMeta,
						pluginFunc,
						context,
					});
				});
				pluginLoadedPromiseMap.set(pluginMeta.id, loadedPluginPromise);
			}

			console.log("正在加载插件脚本，总计", pluginScripts.length, "个插件");

			await Promise.all(
				pluginScripts.map((v) =>
					v().catch((err) => console.warn("插件加载失败", err)),
				),
			);

			for (const plugin of loadedPlugins) {
				plugin.context.dispatchEvent(new Event("plugin-load"));
			}
			store.set(loadedPluginsAtom, loadedPlugins);
		})();
		return () => {
			console.log("插件上下文已卸载，正在触发插件卸载事件");
			pluginsLoadPromise.then(() => {
				for (const plugin of loadedPlugins) {
					plugin.context.dispatchEvent(new Event("plugin-unload"));
				}
			});
		};
	}, [store, i18n]);

	return null;
};

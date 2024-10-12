import { fromObject, fromSource, removeComments } from "convert-source-map";
import type { ComponentType } from "react";
import { SourceMapConsumer, SourceMapGenerator } from "source-map-js";
import type { db } from "../../dexie";
import type ExtensionEnv from "../../extension-env";
import i18n from "../../i18n";
import type { ExtensionMetaState } from "../../states/extension";

export async function sourceMapOffsetLines(
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
					`${location.origin}/extensions/${sourceRoot}/${m.source.replace(/^(\.*\/)+/, "")}`,
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

export class PlayerExtensionContext
	extends EventTarget
	implements ExtensionEnv.ExtensionContext
{
	/**
	 * @internal
	 */
	registeredInjectPointComponent: {
		[injectPointName: string]: ComponentType | undefined;
	} = {};
	constructor(
		readonly playerStates: ExtensionEnv.ExtensionContext["playerStates"],
		readonly amllStates: ExtensionEnv.ExtensionContext["amllStates"],
		readonly i18n: ExtensionEnv.ExtensionContext["i18n"],
		readonly jotaiStore: ExtensionEnv.ExtensionContext["jotaiStore"],
		readonly extensionMeta: Readonly<ExtensionMetaState>,
		readonly lyric: typeof import("@applemusic-like-lyrics/lyric"),
		readonly playerDB: typeof db,
	) {
		super();
	}
	extensionApiNumber = 1;
	registerLocale<T>(localeData: { [langId: string]: T }) {
		for (const [lng, data] of Object.entries(localeData)) {
			i18n.addResourceBundle(lng, this.extensionMeta.id, data);
		}
	}
	registerComponent(injectPointName: string, injectComponent: ComponentType) {
		this.registeredInjectPointComponent[injectPointName] = injectComponent;
	}
	registerPlayerSource(_idPrefix: string) {
		console.warn("Unimplemented");
	}
}

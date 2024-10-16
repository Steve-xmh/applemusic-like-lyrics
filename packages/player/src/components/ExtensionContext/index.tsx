import * as lyric from "@applemusic-like-lyrics/lyric";
import * as amllStates from "@applemusic-like-lyrics/react-full/states";
import chalk from "chalk";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { type FC, useCallback, useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { uid } from "uid";
import { db } from "../../dexie";
import * as playerStates from "../../states";
import {
	ExtensionLoadResult,
	type ExtensionMetaState,
	type LoadedExtension,
	extensionMetaAtom,
	loadedExtensionAtom,
} from "../../states/extension";
import { PlayerExtensionContext, sourceMapOffsetLines } from "./ext-ctx";

const AsyncFunction: FunctionConstructor = Object.getPrototypeOf(
	async () => {},
).constructor;

class Notify {
	promise: Promise<void>;
	resolve: () => void;
	reject: (err: Error) => void;
	constructor() {
		let resolve: () => void = () => {};
		let reject: (err: Error) => void = () => {};
		const p = new Promise<void>((res, rej) => {
			resolve = res;
			reject = rej;
		});
		this.promise = p;
		this.resolve = resolve;
		this.reject = reject;
	}

	wait() {
		return this.promise;
	}

	notify() {
		this.resolve();
	}
}

const LOG_TAG = chalk.bgHex("#00AAFF").hex("#FFFFFF")(" EXTENSION ");

const SingleExtensionContext: FC<{
	extensionMeta: ExtensionMetaState;
	waitForDependency: (extensionId: string) => Promise<void>;
	extPromise: readonly [Promise<void>, () => void, (err: Error) => void];
}> = ({ extensionMeta, waitForDependency, extPromise }) => {
	const store = useStore();
	const { i18n } = useTranslation();
	const cancelRef = useRef<Notify>();
	const setLoadedExtension = useSetAtom(loadedExtensionAtom);
	useEffect(() => {
		let canceled = false;
		const extI18n = i18n.cloneInstance({
			ns: extensionMeta.id,
		});

		const context = new PlayerExtensionContext(
			Object.freeze(Object.assign({}, playerStates)),
			Object.freeze(Object.assign({}, amllStates)),
			extI18n,
			store,
			extensionMeta,
			lyric,
			db,
		);

		const loadedExt: LoadedExtension = {
			extensionFunc: async () => {},
			extensionMeta,
			context,
		};

		(async () => {
			const [React, ReactDOM, Jotai, RadixTheme, JSXRuntime] =
				await Promise.all([
					import("react"),
					import("react-dom"),
					import("jotai"),
					import("@radix-ui/themes"),
					import("react/jsx-runtime"),
				]);
			const globalWindow = window as any;
			globalWindow.React = React;
			globalWindow.ReactDOM = ReactDOM;
			globalWindow.Jotai = Jotai;
			globalWindow.RadixTheme = RadixTheme;
			globalWindow.JSXRuntime = JSXRuntime;
			const cancelNotify = cancelRef.current;
			if (cancelNotify) {
				await cancelNotify.wait();
			}
			if (canceled) return;
			console.log(
				LOG_TAG,
				"正在加载扩展程序",
				extensionMeta.id,
				extensionMeta.fileName,
			);
			const genFuncName = () => `__amll_internal_${uid()}`;
			const resolveFuncName = genFuncName();
			const rejectFuncName = genFuncName();
			const waitForDependencyFuncName = genFuncName();
			const wrapperScript: string[] = [];
			wrapperScript.push('"use strict";');
			wrapperScript.push("try {");

			for (const dependencyId of extensionMeta.dependency) {
				wrapperScript.push(
					`await ${waitForDependencyFuncName}(${JSON.stringify(dependencyId)})`,
				);
			}

			let comment = "";
			const offsetLines = wrapperScript.length + 2;

			try {
				// 修正源映射表的行数，方便调试
				const [code, sourceMapComment] = await sourceMapOffsetLines(
					extensionMeta.scriptData,
					extensionMeta.id,
					offsetLines,
				);
				if (canceled) return;
				wrapperScript.push(code);
				comment = sourceMapComment;
			} catch (err) {
				console.log(
					LOG_TAG,
					"无法转换源映射表，可能是扩展程序并不包含源映射表",
					err,
				);
				wrapperScript.push(extensionMeta.scriptData);
			}

			wrapperScript.push(`${resolveFuncName}();`);
			wrapperScript.push("} catch (err) {");
			wrapperScript.push(`${rejectFuncName}(err);`);
			wrapperScript.push("}");
			wrapperScript.push(comment);

			const extensionFunc: () => Promise<void> = new AsyncFunction(
				"extensionContext",
				resolveFuncName,
				rejectFuncName,
				waitForDependencyFuncName,
				wrapperScript.join("\n"),
			).bind(context, context, extPromise[1], extPromise[2], waitForDependency);

			if (canceled) return;
			await extensionFunc();
			context.dispatchEvent(new Event("extension-load"));

			console.log(
				LOG_TAG,
				"扩展程序",
				extensionMeta.id,
				extensionMeta.fileName,
				"加载完成",
			);
			setLoadedExtension((v) => [...v, loadedExt]);
		})();
		return () => {
			canceled = true;
			const notify = new Notify();
			cancelRef.current = notify;
			(async () => {
				context.dispatchEvent(new Event("extension-unload"));
				setLoadedExtension((v) => v.filter((e) => e !== loadedExt));
				notify.notify();
			})();
		};
	}, [
		extensionMeta,
		i18n,
		store,
		waitForDependency,
		setLoadedExtension,
		extPromise,
	]);

	return null;
};

export const ExtensionContext: FC = () => {
	const extensionMeta = useAtomValue(extensionMetaAtom);

	const loadableExtensions = useMemo(
		() =>
			extensionMeta.filter(
				(v) => v.loadResult === ExtensionLoadResult.Loadable,
			),
		[extensionMeta],
	);
	const loadingPromisesMap = useMemo(
		() =>
			new Map(
				loadableExtensions.map((state) => {
					let resolve: () => void = () => {};
					let reject: (err: Error) => void = () => {};
					const p = new Promise<void>((res, rej) => {
						resolve = res;
						reject = rej;
					});
					return [state.id, [p, resolve, reject] as const] as const;
				}),
			),
		[loadableExtensions],
	);

	const waitForDependency = useCallback(
		async (extensionId: string) => {
			const promise = loadingPromisesMap.get(extensionId);
			if (promise) {
				await promise[0];
			} else {
				throw new Error(`Missing Dependency: ${extensionId}`);
			}
		},
		[loadingPromisesMap],
	);

	return loadableExtensions.map((metaState) => {
		const extPromise = loadingPromisesMap.get(metaState.id)!;
		return (
			<SingleExtensionContext
				key={`${metaState.fileName}-${metaState.id}`}
				extensionMeta={metaState}
				waitForDependency={waitForDependency}
				extPromise={extPromise}
			/>
		);
	});
};

export default ExtensionContext;

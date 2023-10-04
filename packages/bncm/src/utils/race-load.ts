import type { Loadable } from "jotai/vanilla/utils/loadable";
import { log, warn } from "./logger";

type ItemRead<Item, Return> = (
	item: Item,
	options: {
		readonly signal: AbortSignal;
	},
) => Promise<Return>;

interface ItemLoadableTaskState<Return> {
	task: Return | Promise<Return>;
	result: Loadable<Return>;
	abortController: AbortController;
}

// 一个 loadable 的增强版本，允许对一个数组内的多个值进行异步加载
// 并且下标越小的值优先级越高，也就是如果下标高的值比下标低的值先加载完成，则下标低的值加载完成后会覆盖下标高的值
// 如果下标低的值先加载成功，则下标高的值不会再加载
// 如果下标低的值加载失败，则下标高的值会继续加载，直到全部加载完成或者加载失败
// 只有全部加载失败的时候，才会返回错误
export function raceLoad<Return, Value>(
	list: Value[],
	loader: ItemRead<Value, Awaited<Return>>,
	onSetLoadedItem: (
		item: Value,
		index: number,
		result: Loadable<Return>,
	) => void,
	onItemDone?: (item: Value, index: number, result: Loadable<Return>) => void,
): () => void {
	const abort = new AbortController();
	let loadedIndex = list.length + 1;

	abort.signal.addEventListener("abort", () => {
		log("raceLoad", "abort");
	});

	const tasks: ItemLoadableTaskState<Return>[] = list.map((item, index) => {
		const taskAbort = new AbortController();
		abort.signal.addEventListener("abort", () => {
			taskAbort.abort();
		});
		try {
			const task = loader(item, { signal: taskAbort.signal });
			task
				.then((result) => {
					if (taskAbort.signal.aborted) return;
					if (index < loadedIndex) {
						loadedIndex = index;
						onSetLoadedItem(item, index, { state: "hasData", data: result });
						tasks.slice(index + 1).forEach((t) => t.abortController.abort());
					}
					onItemDone?.(item, index, { state: "hasData", data: result });
				})
				.catch((error) => {
					if (taskAbort.signal.aborted) return;
					onItemDone?.(item, index, { state: "hasError", error });
				})
				.finally(() => {
					if (taskAbort.signal.aborted) return;
					if (tasks.every((v) => v.result.state === "hasError")) {
						onSetLoadedItem(item, index, {
							state: "hasError",
							error: tasks.map(
								(t) => t.result.state === "hasError" && t.result.error,
							),
						});
					}
				});
			return { task, result: { state: "loading" }, abortController: taskAbort };
		} catch (error) {
			warn("raceLoad", item, error);
			taskAbort.abort();
			return {
				task: Promise.reject(error),
				result: { state: "hasError", error },
				abortController: taskAbort,
			};
		}
	});

	return () => {
		abort.abort();
	};
}

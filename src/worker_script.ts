import { error, log } from "./utils/logger";
import {
	definedFunctions,
	WorkerCallMessage,
	WorkerResultMessage,
} from "./worker/index";

onmessage = async (evt: MessageEvent<WorkerCallMessage>) => {
	try {
		log("正在执行后台任务", evt.data.id, evt.data.funcName, evt.data.args);
		const ret = definedFunctions[evt.data.funcName].funcBody(...evt.data.args);
		const result = await ret;
		postMessage({
			id: evt.data.id,
			result: result,
		} as WorkerResultMessage);
	} catch (err) {
		error(
			"后台任务发生错误",
			evt.data.id,
			evt.data.funcName,
			evt.data.args,
			err,
		);
		postMessage({
			id: evt.data.id,
			result: undefined,
			error: err,
		} as WorkerResultMessage);
	}
};

log("AMLL 后台线程正在运行！");

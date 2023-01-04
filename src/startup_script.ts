import { debug, log, warn } from "./logger";

const hookCall = channel.call;

channel.call = function AppleMusicLikeLyricCallHook(
	cmd: string,
	// rome-ignore lint/suspicious/noExplicitAny: Hook
	...args: any[]
) {
	if (cmd === "storage.downloadscanner") {
		log(cmd, ...args, new Error().stack);
	} else {
		return hookCall(cmd, ...args);
	}
};

function bindEffect(beforeProcess?: Function, afterProcess?: Function) {
	const targetFunc = this;
	const resultFunction = function (...args) {
		var tmp = { args, stopped: false, value: undefined };
		if (beforeProcess) beforeProcess(tmp);
		if (!tmp.stopped) {
			tmp.value = targetFunc.apply(this, tmp.args);
			if (afterProcess) afterProcess(tmp);
		}
		return tmp.value;
	};
	resultFunction.name = `${targetFunc.name}_bindEffect`;
	resultFunction.wrapperType = "bindEffect";
	resultFunction.originalFunc = targetFunc;
	resultFunction.beforeProcess = beforeProcess;
	resultFunction.afterProcess = afterProcess;
	return resultFunction;
}

function bindPrepend(callThis, ...prependArgs) {
	const targetFunc = this;
	const resultFunction = function (...args) {
		const newArgs = [...prependArgs, ...args];
		return targetFunc.apply(callThis || window, newArgs);
	};
	resultFunction.name = `${targetFunc.name}_bindPrepend`;
	resultFunction.wrapperType = "bindPrepend";
	resultFunction.originalFunc = targetFunc;
	resultFunction.prependArgs = prependArgs;
	return resultFunction;
}

function bindAppend(callThis, ...appendArgs) {
	const targetFunc = this;
	const resultFunction = function (...args) {
		const newArgs = [...args, ...appendArgs];
		return targetFunc.apply(callThis || window, newArgs);
	};
	resultFunction.name = `${targetFunc.name}_bindAppend`;
	resultFunction.wrapperType = "bindAppend";
	resultFunction.originalFunc = targetFunc;
	resultFunction.appendArgs = appendArgs;
	return resultFunction;
}

let setList = [bindAppend, bindPrepend, bindEffect];
// let setList = [];

// rome-ignore lint/suspicious/noExplicitAny: 不解释
(window as any).FakeFunction = new Proxy(
	{},
	{
		set(target, prop, value) {
			const hook = setList.pop();

			if (hook) {
				Function.prototype[prop] = hook;
				log("已 Hook 函数", prop, value, "到", hook);
			} else {
				warn("警告：没有可用函数可以用于 Hook", prop, value);
				Function.prototype[prop] = value;
			}

			return true;
		},
	},
);

function modifyTemplate(
	id: string,
	modifierFunction: (root: Document) => void,
) {
	const moduleElement = document.getElementById(id);
	if (moduleElement) {
		const doc = new DOMParser().parseFromString(
			moduleElement.innerText,
			"text/html",
		);

		modifierFunction(doc);

		const textContent = doc.body.innerHTML;
		if (textContent) {
			debug(textContent);
			moduleElement.innerText = textContent;
			log("布局", id, "修改完成");
		} else {
			warn("布局修改失败：找不到根节点的 innerHTML", id);
		}
	} else {
		warn("布局修改失败：找不到指定 ID 的模板布局元素", id);
	}
}

window.addEventListener("DOMContentLoaded", () => {
	// 在这里修改歌词页面的布局，具体是变更 #m-fdtt-module 元素下的内容
	modifyTemplate("m-fdtt-module", (doc) => {
		// 直接隐藏原歌词和音乐信息，全部用自己的
		const nowPlayingFrame = doc.querySelector('.n-single')
		const appleLyricDiv = document.createElement("div");
		appleLyricDiv.id = "applemusic-like-lyrics-view";
		nowPlayingFrame?.parentNode?.prepend(appleLyricDiv);
		nowPlayingFrame?.setAttribute("style", "display:none;");
	});
});

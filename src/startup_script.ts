import { debug, log, warn } from "./logger";

const hookCall = channel.call;

channel.call = function AppleMusicLikeLyricCallHook(
	cmd: string,
	// rome-ignore lint/suspicious/noExplicitAny: Hook
	...args: any[]
) {
	if (cmd === "storage.downloadscanner") {
		console.log(cmd, ...args, new Error().stack);
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
				console.log("已 Hook 函数", prop, value, "到", hook);
			} else {
				console.warn("警告：没有可用函数可以用于 Hook", prop, value);
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

function modifyTemplateInText(
	id: string,
	modifierFunction: (root: string) => string,
) {
	// log("正在修改布局", id);
	const moduleElement = document.getElementById(id);
	// debug(moduleElement);
	if (moduleElement) {
		const result = modifierFunction(moduleElement.innerText);

		debug(result);
		moduleElement.innerText = result;
		log("布局", id, "修改完成");
	} else {
		warn("布局修改失败：找不到指定 ID 的模板布局元素", id);
	}
}

function insertString(origin: string, index: number, string: String) {
	if (index > 0) {
		return origin.substring(0, index) + string + origin.substring(index);
	} else {
		return string + origin;
	}
}

window.addEventListener("DOMContentLoaded", () => {
	// 在这里修改歌词页面的布局，具体是变更 #m-fdtt-module 元素下的内容
	modifyTemplate("m-fdtt-module", (doc) => {
		// 歌名部分的位置
		const headElement = doc.querySelector(".head.j-fflag");
		const albumFlexElement = doc.querySelector(".sd.j-flag");
		if (!!headElement && !!albumFlexElement) {
			if (headElement.parentNode) {
				headElement.parentNode.removeChild(headElement);
			}
			albumFlexElement.appendChild(headElement);
			log("成功修改了歌名布局");
		} else {
			warn("歌名布局修改失败！");
		}
		const originalLyricFlexElement = doc.querySelector(".mn.j-flag");
		const appleLyricDiv = document.createElement("div");
		appleLyricDiv.id = "applemusic-like-lyrics-view";
		originalLyricFlexElement?.parentNode?.appendChild(appleLyricDiv);
		if (originalLyricFlexElement) {
			originalLyricFlexElement.setAttribute("style", "display:none;");
		}
	});

	modifyTemplateInText("m-fdtt-show-track-title-detail", (doc) => {
		let result = doc;
		const aliasReg = /<h2.*?<\/h2>/m;
		const titleReg = /<\/h1>/m;

		const alias = result.match(aliasReg)?.[0] || "";
		result = result.replace(aliasReg, "");

		const title = result.match(titleReg);
		if (title) {
			result = insertString(result, title.index || 0 + title[0].length, alias);
		}

		result = result.replace("歌手: ", "");
		result = result.replace("专辑: ", "");
		result = result.replace("来源: ", "");

		let lastPos = 0;
		for (let i = 0; i < 2; i++) {
			lastPos = result.indexOf('<li class="f-thide f-ust f-ust-1">', lastPos);
			if (lastPos !== -1) {
				lastPos = result.indexOf("</li>", lastPos);
				if (lastPos !== -1) {
					lastPos += 5;
					const insertContent = `<li class="f-thide f-ust f-ust-1 spacer"> — <li/>`;
					result = insertString(result, lastPos, insertContent);
					lastPos += insertContent.length;
				}
			}
		}

		return result;
	});
});

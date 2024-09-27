import {
	type TextLayoutConfig,
	layoutWord,
} from "./lyric-player/canvas/text-layout";

const canvas = document.createElement("canvas");
canvas.width = 600 * devicePixelRatio;
canvas.height = 400 * devicePixelRatio;
canvas.style.border = "1px solid black";
canvas.style.width = "600px";
canvas.style.height = "400px";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

const textInput = document.createElement("input");
const fontSizeInput = document.createElement("input");
const config: TextLayoutConfig = Object.seal({
	fontSize: 60,
	maxWidth: 400,
	lineHeight: 1.2,
	uniformSpace: true,
});
function redraw() {
	ctx.resetTransform();
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	config.fontSize = fontSizeInput.valueAsNumber;

	ctx.font = `${config.fontSize}px sans-serif`;
	ctx.fillStyle = "black";
	ctx.strokeStyle = "red";
	ctx.scale(devicePixelRatio, devicePixelRatio);
	ctx.translate(100, 100);

	ctx.strokeRect(0, -config.fontSize - 5, config.maxWidth, 1);
	const start = performance.now();
	for (const wordLayout of layoutWord(ctx, textInput.value, config)) {
		ctx.filter = "none";
		ctx.strokeRect(
			wordLayout.x,
			wordLayout.lineIndex * (config.fontSize * config.lineHeight) -
				config.fontSize,
			wordLayout.width,
			config.fontSize,
		);
		if (wordLayout.lineIndex > 0)
			ctx.filter = `blur(${wordLayout.lineIndex}px)`;
		ctx.fillText(
			wordLayout.text,
			wordLayout.x,
			wordLayout.lineIndex * (config.fontSize * config.lineHeight),
		);
	}
	console.log(performance.now() - start);
}

textInput.type = "text";
textInput.placeholder = "输入文字";
textInput.style.width = "100%";
textInput.style.padding = "5px";
textInput.style.boxSizing = "border-box";
textInput.value =
	"Hello, World! AWAY! 你好世界！Lyric Test Test 你好世界！你好世界！タンタン \\(°▽ ° )";
textInput.addEventListener("input", () => {
	redraw();
});
document.body.appendChild(textInput);

fontSizeInput.type = "number";
fontSizeInput.placeholder = "字体大小";
fontSizeInput.style.width = "100%";
fontSizeInput.style.padding = "5px";
fontSizeInput.style.boxSizing = "border-box";
fontSizeInput.valueAsNumber = 40;
fontSizeInput.addEventListener("input", () => {
	redraw();
});
document.body.appendChild(fontSizeInput);

addEventListener(
	"load",
	() => {
		redraw();
	},
	{
		once: true,
	},
);

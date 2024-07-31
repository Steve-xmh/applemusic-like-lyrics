/**
 * @fileoverview
 * 调试 MG 渲染器的测试脚本
 *
 * @author SteveXMH
 */
import Stats from "stats.js";
import GUI from "lil-gui";
import { BackgroundRender, MeshGradientRenderer } from "./bg-render";

const debugValues = {
	controlPointSize: 3,
	subdivideDepth: 15,
	wireFrame: false,
};

const canvas = document.getElementById("bg")!! as HTMLCanvasElement;
const mgRenderer = new MeshGradientRenderer(canvas);

mgRenderer.setManualControl(true);
mgRenderer.setFPS(Infinity);

function updateControlPointDraggers() {
	document.querySelectorAll(".dragger").forEach((el) => {
		const x = parseInt(el.getAttribute("x")!);
		const y = parseInt(el.getAttribute("y")!);
		const point = mgRenderer.getControlPoint(x, y);
		(el as HTMLElement).style.left = `${(point.location.x + 1) * 50}%`;
		(el as HTMLElement).style.top = `${(1 - point.location.y) * 50}%`;
	});
}

window.addEventListener("resize", updateControlPointDraggers);

const resultTextArea = document.getElementById(
	"result",
)!! as HTMLTextAreaElement;
resultTextArea.value = "// 控制点的设置代码将会在这里显示";
function updateResult() {
	const result = ["let point: ControlPoint;"];
	for (let y = 0; y < debugValues.controlPointSize; y++) {
		for (let x = 0; x < debugValues.controlPointSize; x++) {
			const point = mgRenderer.getControlPoint(x, y);
			result.push("");
			result.push(`point = this.getControlPoint(${x}, ${y});`);
			result.push(`point.color.r = ${point.color.r};`);
			result.push(`point.color.g = ${point.color.g};`);
			result.push(`point.color.b = ${point.color.b};`);
			result.push(`point.location.x = ${point.location.x};`);
			result.push(`point.location.y = ${point.location.y};`);
		}
	}
	resultTextArea.value = result.join("\n");
}

function resizeControlPoint() {
	document
		.querySelectorAll(".dragger")
		.forEach((el) => el.parentElement?.removeChild(el));
	mgRenderer.resizeControlPoints(
		debugValues.controlPointSize,
		debugValues.controlPointSize,
	);

	for (let y = 0; y < debugValues.controlPointSize; y++) {
		for (let x = 0; x < debugValues.controlPointSize; x++) {
			const point = mgRenderer.getControlPoint(x, y);
			const dragger = document.createElement("div");
			const draggerInput = document.createElement("input");
			draggerInput.type = "color";
			draggerInput.style.position = "absolute";
			draggerInput.style.visibility = "hidden";
			dragger.appendChild(draggerInput);
			dragger.setAttribute("x", `${x}`);
			dragger.setAttribute("y", `${y}`);
			dragger.className = "dragger";
			dragger.style.left = `${(x * 100) / (debugValues.controlPointSize - 1)}%`;
			dragger.style.top = `${
				((debugValues.controlPointSize - y - 1) * 100) /
				(debugValues.controlPointSize - 1)
			}%`;
			draggerInput.addEventListener("input", () => {
				// mgRenderer.getControlPoint(x, y).color = dragger.value;
				dragger.style.backgroundColor = draggerInput.value;
				const color = draggerInput.value.match(
					/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i,
				);
				if (color) {
					point.color.r = parseInt(color[1], 16) / 255;
					point.color.g = parseInt(color[2], 16) / 255;
					point.color.b = parseInt(color[3], 16) / 255;
					dragger.setAttribute("r", `${point.color.r}`);
					dragger.setAttribute("g", `${point.color.g}`);
					dragger.setAttribute("b", `${point.color.b}`);
					updateResult();
				}
			});
			let dragging = false;
			dragger.addEventListener("mousedown", (evt) => {
				evt.stopPropagation();
				function onMouseMove(evt: MouseEvent) {
					dragger.style.left = `${Math.min(
						window.innerWidth,
						Math.max(0, evt.clientX),
					)}px`;
					dragger.style.top = `${Math.min(
						window.innerHeight,
						Math.max(0, evt.clientY),
					)}px`;
					point.location.x = Math.max(
						-1,
						Math.min(1, (evt.clientX / window.innerWidth) * 2 - 1),
					);
					point.location.y = Math.max(
						-1,
						Math.min(1, -((evt.clientY / window.innerHeight) * 2 - 1)),
					);
					dragging = true;
					updateResult();
					evt.stopPropagation();
				}
				function onMouseUp() {
					if (dragging) {
						dragging = false;
					} else {
						draggerInput.click();
					}
					window.removeEventListener("mousemove", onMouseMove);
					window.removeEventListener("mouseup", onMouseUp);
					evt.stopPropagation();
				}
				window.addEventListener("mousemove", onMouseMove);
				window.addEventListener("mouseup", onMouseUp);
			});
			document.body.appendChild(dragger);
		}
	}
}

function subdivide() {
	mgRenderer.resetSubdivition(debugValues.subdivideDepth);
}

resizeControlPoint();
subdivide();

const gui = new GUI();
gui.close();
gui.title("MG Renderer 调试页面");
gui
	.add(debugValues, "controlPointSize", 3, 10, 1)
	.name("控制点矩阵大小")
	.onFinishChange(resizeControlPoint);
gui
	.add(debugValues, "subdivideDepth", 2, 50, 1)
	.name("细分深度")
	.onChange(subdivide);
gui
	.add(debugValues, "wireFrame")
	.name("线框模式")
	.onChange((v: boolean) => mgRenderer.setWireFrame(v));

const stats = new Stats();
stats.showPanel(0);
stats.dom.style.left = "50px";
document.body.appendChild(stats.dom);
let lastTime = -1;
const frame = (time: number) => {
	stats.end();
	lastTime = time;
	stats.begin();
	requestAnimationFrame(frame);
};
requestAnimationFrame(frame);

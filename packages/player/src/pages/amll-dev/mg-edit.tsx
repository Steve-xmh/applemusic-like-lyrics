import { MeshGradientRenderer } from "@applemusic-like-lyrics/core";
import { musicCoverAtom } from "@applemusic-like-lyrics/react-full";
import { ArrowLeftIcon, CodeIcon } from "@radix-ui/react-icons";
import {
	Card,
	Dialog,
	Flex,
	Grid,
	HoverCard,
	IconButton,
	Separator,
	Slider,
	Switch,
	Text,
	TextArea,
	TextField,
} from "@radix-ui/themes";
import { useAtomValue } from "jotai";
import {
	type FC,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useHideNowPlayingBar } from "../../utils/uses";

interface ControlPointHandleState {
	color: [number, number, number];
	cpX: number;
	cpY: number;
	x: number;
	y: number;
	uRot: number;
	vRot: number;
	uScale: number;
	vScale: number;
}

const ControlPointHandle: FC<{
	point: ControlPointHandleState;
	onPointChange: (point: ControlPointHandleState) => void;
}> = ({ point, onPointChange }) => {
	const handlerRef = useRef<HTMLDivElement>(null);
	return (
		<HoverCard.Root>
			<HoverCard.Trigger>
				<div
					ref={handlerRef}
					style={{
						position: "absolute",
						width: "1em",
						height: "1em",
						borderRadius: "50%",
						border: "solid 3px #8888",
						transform: "translate(-50%, -50%)",
						cursor: "move",
						userSelect: "none",
						left: `${(point.x + 1) * 50}%`,
						top: `${(1 - point.y) * 50}%`,
					}}
					cp={`${point.cpX}-${point.cpY}`}
					onMouseDown={(e) => {
						e.stopPropagation();
						function checkPos(evt: MouseEvent) {
							const handler = handlerRef.current;
							const parent = handler?.parentElement;
							if (handler === null || !parent) return;
							const rect = parent.getBoundingClientRect();
							const x = (evt.clientX - rect.left) / rect.width;
							const y = (evt.clientY - rect.top) / rect.height;
							point.x = Math.max(Math.min(x * 2 - 1, 1), -1);
							point.y = Math.max(Math.min(1 - y * 2, 1), -1);
							console.log(point.x, point.y);
							handler.style.left = `${(point.x + 1) * 50}%`;
							handler.style.top = `${(1 - point.y) * 50}%`;
						}
						function onMouseMove(evt: MouseEvent) {
							checkPos(evt);
							evt.stopPropagation();
							onPointChange(point);
						}
						function onMouseUp(evt: MouseEvent) {
							window.removeEventListener("mousemove", onMouseMove);
							window.removeEventListener("mouseup", onMouseUp);
							checkPos(evt);
							evt.stopPropagation();
							onPointChange(point);
						}
						window.addEventListener("mousemove", onMouseMove);
						window.addEventListener("mouseup", onMouseUp);
					}}
				/>
			</HoverCard.Trigger>
			<HoverCard.Content
				style={{
					minWidth: "20em",
				}}
			>
				<Grid
					columns="2"
					rows="2"
					gapX="2"
					gapY="1"
					align="baseline"
					style={{
						gridTemplateColumns: "auto 1fr",
					}}
				>
					<Text>控制点</Text>
					<Text>
						({point.cpX}/{point.cpY})
					</Text>
					<Text>横坐标</Text>
					<TextField.Root
						type="number"
						min={-1.0}
						max={1.0}
						value={point.x}
						onChange={(e) => {
							point.x = e.target.valueAsNumber;
							onPointChange(point);
						}}
					/>
					<Text>纵坐标</Text>
					<TextField.Root
						type="number"
						min={-1.0}
						max={1.0}
						value={point.y}
						onChange={(e) => {
							point.y = e.target.valueAsNumber;
							onPointChange(point);
						}}
					/>
					<Text>颜色</Text>
					<input
						type="color"
						value={`#${point.color
							.slice(0, 3)
							.map((v) => v.toString(16).padStart(2, "0"))
							.join("")}`}
						onChange={(e) => {
							const color = e.target.value.match(
								/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i,
							);
							if (color) {
								point.color[0] = Number.parseInt(color[1], 16) / 255;
								point.color[1] = Number.parseInt(color[2], 16) / 255;
								point.color[2] = Number.parseInt(color[3], 16) / 255;
								onPointChange(point);
							}
						}}
					/>
					<Text>横向缩放</Text>
					<Flex gap="2" align="center">
						<Slider
							min={0}
							max={5}
							step={0.001}
							value={[point.uScale]}
							onValueChange={(value) => {
								point.uScale = value[0];
								onPointChange(point);
							}}
						/>
						<TextField.Root
							type="number"
							min={0}
							max={5}
							value={point.uScale}
							style={{ minWidth: "5em" }}
							onChange={(e) => {
								point.uScale = e.target.valueAsNumber;
								onPointChange(point);
							}}
						/>
					</Flex>
					<Text>纵向缩放</Text>
					<Flex gap="2" align="center">
						<Slider
							min={0}
							max={5}
							step={0.001}
							value={[point.vScale]}
							onValueChange={(value) => {
								point.vScale = value[0];
								onPointChange(point);
							}}
						/>
						<TextField.Root
							type="number"
							min={0}
							max={5}
							value={point.vScale}
							style={{ minWidth: "5em" }}
							onChange={(e) => {
								point.uScale = e.target.valueAsNumber;
								onPointChange(point);
							}}
						/>
					</Flex>
					<Text>横向扭曲角度</Text>
					<Flex gap="2" align="center">
						<Slider
							min={-90}
							max={90}
							step={1}
							value={[point.uRot]}
							onValueChange={(value) => {
								point.uRot = value[0];
								onPointChange(point);
							}}
						/>
						<TextField.Root
							type="number"
							min={-90}
							max={90}
							value={point.uRot}
							style={{ minWidth: "5em" }}
							onChange={(e) => {
								point.uRot = e.target.valueAsNumber;
								onPointChange(point);
							}}
						/>
					</Flex>
					<Text>纵向扭曲角度</Text>
					<Flex gap="2" align="center">
						<Slider
							min={-90}
							max={90}
							step={1}
							value={[point.vRot]}
							onValueChange={(value) => {
								point.vRot = value[0];
								onPointChange(point);
							}}
						/>
						<TextField.Root
							type="number"
							min={-90}
							max={90}
							value={point.vRot}
							style={{ minWidth: "5em" }}
							onChange={(e) => {
								point.vRot = e.target.valueAsNumber;
								onPointChange(point);
							}}
						/>
					</Flex>
				</Grid>
			</HoverCard.Content>
		</HoverCard.Root>
	);
};

const CodeButton: FC<{
	controlPointSize: number;
	controlPoints: ControlPointHandleState[];
}> = ({ controlPoints, controlPointSize }) => {
	const code = useMemo(() => {
		const result = [`preset(${controlPointSize}, ${controlPointSize}, [`];
		for (let y = 0; y < controlPointSize; y++) {
			for (let x = 0; x < controlPointSize; x++) {
				const point = controlPoints[y * controlPointSize + x];
				if (point === undefined) continue;
				result.push(
					`	p(${x}, ${y}, ${point.x}, ${point.y}, ${point.uRot}, ${point.vRot}, ${point.uScale}, ${point.vScale}),`,
				);
			}
		}
		result.push("]),");
		return result.join("\n");
	}, [controlPoints, controlPointSize]);

	return (
		<Dialog.Root>
			<Dialog.Trigger>
				<IconButton variant="soft">
					<CodeIcon />
				</IconButton>
			</Dialog.Trigger>
			<Dialog.Content>
				<TextArea
					value={code}
					contentEditable="false"
					style={{
						minHeight: "20em",
						fontFamily: "var(--code-font-family)",
					}}
				/>
			</Dialog.Content>
		</Dialog.Root>
	);
};

export const MGEditPage: FC = () => {
	useHideNowPlayingBar();
	const frameRef = useRef<HTMLDivElement>(null);
	const mgRenderer = useRef<MeshGradientRenderer>();
	const cover = useAtomValue(musicCoverAtom);
	const [controlPointSize, setControlPointSize] = useState(4);
	const [controlPoints, setControlPoints] = useState<ControlPointHandleState[]>(
		[],
	);
	const [wireframe, setWireframe] = useState(false);

	const onControlPointChange = useCallback(() => {
		setControlPoints((prev) => {
			const mgRendererInstance = mgRenderer.current;
			const uPower = 2 / (controlPointSize - 1);
			const vPower = 2 / (controlPointSize - 1);
			if (mgRendererInstance) {
				for (let y = 0; y < controlPointSize; y++) {
					for (let x = 0; x < controlPointSize; x++) {
						const point = prev[y * controlPointSize + x];
						const cp = mgRendererInstance.getControlPoint(x, y);
						if (cp && point) {
							cp.color.set(point.color);
							cp.location.x = point.x;
							cp.location.y = point.y;
							cp.uRot = (point.uRot / 180) * Math.PI;
							cp.vRot = (point.vRot / 180) * Math.PI;
							cp.uScale = point.uScale * uPower;
							cp.vScale = point.vScale * vPower;
						}
					}
				}
			}
			return [...prev];
		});
	}, [controlPointSize]);

	useLayoutEffect(() => {
		const frame = frameRef.current;
		if (frame === null) return;
		const canvas = document.createElement("canvas");
		frame.appendChild(canvas);
		canvas.style.position = "absolute";
		canvas.style.left = "10vw";
		canvas.style.top = "10vh";
		canvas.style.width = "80vw";
		canvas.style.height = "80vh";
		canvas.style.pointerEvents = "none";
		const newRenderer = new MeshGradientRenderer(canvas);
		newRenderer.setManualControl(true);
		newRenderer.setFPS(Number.POSITIVE_INFINITY);

		mgRenderer.current = newRenderer;
		return () => {
			newRenderer.dispose();
			mgRenderer.current = undefined;
		};
	}, []);

	useEffect(() => {
		const mgRendererInstance = mgRenderer.current;
		if (mgRendererInstance === undefined) return;
		try {
			mgRendererInstance.setAlbum(cover);
		} catch {}
	}, [cover]);

	useEffect(() => {
		const mgRendererInstance = mgRenderer.current;
		if (mgRendererInstance === undefined) return;
		try {
			mgRendererInstance.setWireFrame(wireframe);
		} catch {}
	}, [wireframe]);

	useEffect(() => {
		const newCps = [];
		for (let y = 0; y < controlPointSize; y++) {
			for (let x = 0; x < controlPointSize; x++) {
				const point: ControlPointHandleState = {
					color: Object.seal([1, 1, 1]),
					cpX: x,
					cpY: y,
					x: (x / (controlPointSize - 1)) * 2 - 1,
					y: (y / (controlPointSize - 1)) * 2 - 1,
					uRot: 0,
					vRot: 0,
					uScale: 1,
					vScale: 1,
				};
				newCps.push(Object.seal(point));
			}
		}
		setControlPoints(newCps);
		mgRenderer.current?.resizeControlPoints(controlPointSize, controlPointSize);
		onControlPointChange();
	}, [controlPointSize, onControlPointChange]);

	return (
		<div
			id="mg-edit"
			style={{
				margin: "0",
				padding: "0",
				maxWidth: "100vw",
				maxHeight: "100vh",
				overflow: "hidden",
			}}
			ref={frameRef}
		>
			<Card
				style={{
					position: "absolute",
					left: "50%",
					transform: "translateX(-50%)",
					top: "var(--system-titlebar-height)",
					zIndex: 1,
				}}
			>
				<Flex gap="2" align="center">
					<IconButton variant="soft" onClick={() => history.back()}>
						<ArrowLeftIcon />
					</IconButton>
					<CodeButton
						controlPoints={controlPoints}
						controlPointSize={controlPointSize}
					/>
					<Separator orientation="vertical" size="2" />
					<Text wrap="nowrap">控制点矩阵大小</Text>
					<Slider
						min={2}
						value={[controlPointSize]}
						onValueChange={(value) => {
							setControlPointSize(value[0]);
						}}
						max={10}
						style={{
							width: "5em",
						}}
					/>
					<div style={{ minWidth: "2em", textAlign: "center" }}>
						{controlPointSize}
					</div>
					<Separator orientation="vertical" size="2" />
					<Text wrap="nowrap">线框模式</Text>
					<Switch checked={wireframe} onCheckedChange={setWireframe} />
				</Flex>
			</Card>
			<div
				style={{
					position: "absolute",
					left: "10vw",
					top: "10vh",
					width: "80vw",
					height: "80vh",
					zIndex: "1",
				}}
			>
				{controlPoints.map((point, index) => (
					<ControlPointHandle
						key={`cp-${index}`}
						point={point}
						onPointChange={onControlPointChange}
					/>
				))}
			</div>
		</div>
	);
};

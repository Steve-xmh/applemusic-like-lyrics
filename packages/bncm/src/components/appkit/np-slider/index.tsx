import { HTMLProps, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./np-slider.sass";
import { Spring } from "../../../utils/spring";

export interface SliderProps {
	onAfterChange?: (v: number) => void;
	onBeforeChange?: () => void;
	onChange?: (v: number) => void;
	onSeeking?: (v: boolean) => void;
	value: number;
	min: number;
	max: number;
	beforeIcon?: JSX.Element;
	afterIcon?: JSX.Element;
}

export const Slider: React.FC<
	SliderProps & Omit<HTMLProps<HTMLDivElement>, keyof SliderProps>
> = (props) => {
	const {
		className,
		onAfterChange,
		onBeforeChange,
		onChange,
		onSeeking,
		value,
		min,
		max,
		beforeIcon,
		afterIcon,
		...others
	} = props;
	const [curValue, setCurValue] = useState(value);
	const outerRef = useRef<HTMLDivElement>(null);
	const innerRef = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const outer = outerRef.current;
		const inner = innerRef.current;
		if (outer && inner) {
			const heightSpring = new Spring(80);
			const bounceSpring = new Spring(0);
			let dragging = false;
			heightSpring.updateParams({
				stiffness: 150,
				mass: 1,
				damping: 10,
			});
			bounceSpring.updateParams({
				stiffness: 150,
			});
			let lastTime: number | null = null;
			let handler = 0;
			const onFrame = (dt: number) => {
				lastTime ??= dt;
				const delta = (dt - lastTime) / 1000;

				bounceSpring.update(delta);
				heightSpring.update(delta);
				outer.style.transform = `translateX(${
					bounceSpring.getCurrentPosition() / 100
				}px)`;
				if (innerHeight <= 1000)
					inner.style.height = `${heightSpring.getCurrentPosition() * 0.08}px`;
				else inner.style.height = `${heightSpring.getCurrentPosition() / 10}px`;

				lastTime = dt;

				if (!(heightSpring.arrived() && bounceSpring.arrived())) {
					if (handler) cancelAnimationFrame(handler);
					handler = requestAnimationFrame(onFrame);
				}
			};
			const setValue = (evt: MouseEvent) => {
				const rect = inner.getBoundingClientRect();
				const relPos = (evt.clientX - rect.left) / rect.width;
				if (relPos > 1) {
					const o = (relPos - 1) * 900;
					bounceSpring.setPosition(o);
					bounceSpring.setTargetPosition(o);
				} else if (relPos < 0) {
					const o = relPos * 900;
					bounceSpring.setPosition(o);
					bounceSpring.setTargetPosition(o);
				} else {
					bounceSpring.setPosition(0);
					bounceSpring.setTargetPosition(0);
				}
				const v = Math.min(max, Math.max(min, min + (max - min) * relPos));
				onChange?.(v);
				onSeeking?.(true);
				setCurValue(v);
				if (handler) cancelAnimationFrame(handler);
				handler = requestAnimationFrame(onFrame);
			};
			const onMouseEnter = (evt: MouseEvent) => {
				heightSpring.setTargetPosition(189);
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();
				if (handler) cancelAnimationFrame(handler);
				handler = requestAnimationFrame(onFrame);
			};
			const onMouseLeave = (evt: MouseEvent) => {
				if (!dragging) {
					heightSpring.setTargetPosition(80);
					evt.stopImmediatePropagation();
					evt.stopPropagation();
					evt.preventDefault();
					if (handler) cancelAnimationFrame(handler);
					handler = requestAnimationFrame(onFrame);
					onSeeking?.(false);
				}
			};
			const onMouseDown = (evt: MouseEvent) => {
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();
				heightSpring.setTargetPosition(189);
				lastTime = null;
				dragging = true;
				window.addEventListener("mousemove", onMouseMove);
				window.addEventListener("mouseup", onMouseUp);
				onBeforeChange?.();
				setValue(evt);
			};
			const onMouseUp = (evt: MouseEvent) => {
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();
				heightSpring.setTargetPosition(80);
				lastTime = null;
				dragging = false;
				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("mouseup", onMouseUp);
				setValue(evt);
				bounceSpring.setTargetPosition(0);
				onSeeking?.(false);
			};
			const onMouseMove = (evt: MouseEvent) => {
				setValue(evt);
			};
			inner.addEventListener("mousedown", onMouseDown);
			outer.addEventListener("mouseenter", onMouseEnter);
			outer.addEventListener("mouseleave", onMouseLeave);
			return () => {
				inner.removeEventListener("mousedown", onMouseDown);
				outer.removeEventListener("mouseenter", onMouseEnter);
				outer.removeEventListener("mouseleave", onMouseLeave);
				window.removeEventListener("mouseup", onMouseUp);
				window.removeEventListener("mousemove", onMouseMove);
			};
		}
	}, [
		outerRef.current,
		innerRef.current,
		onAfterChange,
		onChange,
		onSeeking,
		onBeforeChange,
		min,
		max,
	]);
	useEffect(() => {
		setCurValue(value);
	}, [value]);
	return (
		<div
			ref={outerRef}
			className={`appkit-now-playing-slider ${className || ""}`}
			{...others}
		>
			{beforeIcon}
			<div ref={innerRef} className="inner">
				<div
					className="thumb"
					style={{
						width: `${((curValue - min) / (max - min)) * 100}%`,
					}}
				/>
			</div>
			{afterIcon}
		</div>
	);
};

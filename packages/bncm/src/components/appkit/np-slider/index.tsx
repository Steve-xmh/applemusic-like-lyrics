import { HTMLProps, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./np-slider.sass";
import { Spring } from "../../../utils/spring";

export interface SliderProps {
	onAfterChange?: (v: number) => void;
	onBeforeChange?: () => void;
	onChange?: (v: number) => void;
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
            const scaleSpring = new Spring(100);
            const bounceSpring = new Spring(0);
            scaleSpring.updateParams({
                stiffness: 150,
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
                outer.style.transform = `translateX(${bounceSpring.getCurrentPosition() / 100}px)`;

                lastTime = dt;

                if (!(scaleSpring.arrived() && bounceSpring.arrived())) {
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
                setCurValue(v);
                if (handler) cancelAnimationFrame(handler);
                handler = requestAnimationFrame(onFrame);
            };
            const onMouseOver = (evt: MouseEvent) => {
                window.removeEventListener("mouseover", onMouseOver);
            };
			const onMouseDown = (evt: MouseEvent) => {
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();
				scaleSpring.setTargetPosition(105);
				lastTime = null;
				window.addEventListener("mousemove", onMouseMove);
				window.addEventListener("mouseup", onMouseUp);
				onBeforeChange?.();
				setValue(evt);
			};
			const onMouseUp = (evt: MouseEvent) => {
				evt.stopImmediatePropagation();
				evt.stopPropagation();
				evt.preventDefault();
				scaleSpring.setTargetPosition(100);
				lastTime = null;
				window.removeEventListener("mousemove", onMouseMove);
				window.removeEventListener("mouseup", onMouseUp);
				setValue(evt);
				bounceSpring.setTargetPosition(0);
			};
			const onMouseMove = (evt: MouseEvent) => {
				setValue(evt);
			};
			inner.addEventListener("mousedown", onMouseDown);
			return () => {
				inner.removeEventListener("mousedown", onMouseDown);
				window.removeEventListener("mouseup", onMouseUp);
				window.removeEventListener("mousemove", onMouseMove);
			};
		}
	}, [
		outerRef.current,
		innerRef.current,
		onAfterChange,
		onChange,
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

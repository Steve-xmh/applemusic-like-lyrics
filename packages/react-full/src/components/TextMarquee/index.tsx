import classNames from "classnames";
import styles from "./index.module.css";
import type { FC, HTMLProps, PropsWithChildren } from "react";
import { useEffect, useRef } from "react";

export const TextMarquee: FC<PropsWithChildren<HTMLProps<HTMLDivElement>>> = ({
	children,
	className,
	...rest
}) => {
	const outerDiv = useRef<HTMLDivElement>(null);
	const innerDiv = useRef<HTMLDivElement>(null);
	const currentAnimationsRef = useRef(new Set<Animation>());

	const onMouseEnter = () => {
		if (innerDiv.current && outerDiv.current) {
			const outerWidth = outerDiv.current.clientWidth;
			const innerWidth = innerDiv.current.clientWidth;

			if (innerWidth <= outerWidth * 0.95) {
				return;
			}

			outerDiv.current?.classList.add(styles.animating);

			const distance = innerWidth - outerWidth * 0.95;

			const ani = innerDiv.current.animate(
				[
					{
						transform: "translateX(0px)",
					},
					{
						transform: `translateX(${-distance}px)`,
					},
				],
				{
					iterations: 2,
					direction: "alternate",
					easing: "linear",
					duration: Math.max(0, ((distance * 2) / 64) * 1000),
				},
			);

			ani.finished.then(() => {
				outerDiv.current?.classList.remove(styles.animating);
			});

			currentAnimationsRef.current.add(ani);
		}
	};

	const onMouseLeave = () => {
		for (const ani of currentAnimationsRef.current) {
			ani.finish();
		}
		outerDiv.current?.classList.remove(styles.animating);
		currentAnimationsRef.current.clear();
	};

	return (
		<div
			ref={outerDiv}
			className={classNames(styles.textMarquee, className)}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			{...rest}
		>
			<div ref={innerDiv}>{children}</div>
		</div>
	);
};

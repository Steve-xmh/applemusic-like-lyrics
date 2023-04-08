import { classname } from "../../api";
import * as React from "react";
import { LyricLineTransform } from ".";

const dotAnimation = [
	{
		opacity: 0,
	},
	{
		opacity: 0.5,
		offset: 0.1,
	},
	{
		opacity: 1,
	},
];

export const LyricDots: React.FC<
	{
		selected: boolean;
		time: number;
		duration: number;
		offset: number;
		lineTransform: LyricLineTransform;
		onSizeChanged: () => void;
	} & React.HTMLAttributes<HTMLDivElement>
> = ({
	selected,
	time: _time,
	duration,
	offset,
	lineTransform,
	onSizeChanged,
	...props
}) => {
	const dot0 = React.useRef<HTMLDivElement>(null);
	const dot1 = React.useRef<HTMLDivElement>(null);
	const dot2 = React.useRef<HTMLDivElement>(null);
	const dotsRef = React.useRef<HTMLDivElement>(null);

	React.useLayoutEffect(() => {
		const dots = dotsRef.current;
		if (dots) {
			const obs = new ResizeObserver(onSizeChanged);
			obs.observe(dots);
			return () => {
				obs.disconnect();
			};
		}
	}, []);

	React.useLayoutEffect(() => {
		const dot0el = dot0.current;
		const dot1el = dot1.current;
		const dot2el = dot2.current;
		const dots = dotsRef.current;
		if (dot0el && dot1el && dot2el && dots && selected && duration >= 5000) {
			const globalDelay = 750;
			const dotAnimationDuration = Math.max(0, (duration - globalDelay) / 3);
			dotAnimation[1].offset = 0.5;
			dot0el.animate(dotAnimation, {
				duration: dotAnimationDuration,
				delay: globalDelay,
				fill: "both",
			});
			dotAnimation[1].offset =
				(100 + dotAnimationDuration) / (dotAnimationDuration * 2);
			dot1el.animate(dotAnimation, {
				duration: dotAnimationDuration * 2,
				delay: globalDelay,
				fill: "both",
			});
			dotAnimation[1].offset =
				(200 + dotAnimationDuration * 2) / (dotAnimationDuration * 3);
			dot2el.animate(dotAnimation, {
				duration: dotAnimationDuration * 3,
				delay: globalDelay,
				fill: "both",
			});

			const breathDuration = duration - 2000 - globalDelay;
			const breathDelay = 1000;
			const breathTime = Math.floor(breathDuration / 4000);
			const breathGap = Math.max(0, (breathDuration - breathTime * 4000) / 2);

			let stopped = false;

			(async () => {
				if (stopped) return;
				dots.style.opacity = "1";
				await dots.animate(
					[
						{
							transform: "scale(0.9)",
						},
						{
							transform: "scale(1)",
						},
					],
					{
						delay: globalDelay,
						duration: breathDelay,
						endDelay: breathGap,
						easing: "ease-out",
					},
				).finished;
				if (stopped) return;
				for (let i = 0; i < breathTime; i++) {
					if (stopped) return;
					await dots.animate(
						[
							{
								transform: "scale(1.0)",
							},
							{
								transform: "scale(0.9)",
							},
						],
						{
							duration: 2000,
							easing: "ease-in-out",
						},
					).finished;
					if (stopped) return;
					await dots.animate(
						[
							{
								transform: "scale(0.9)",
							},
							{
								transform: "scale(1.0)",
							},
						],
						{
							duration: 2000,
							easing: "ease-in-out",
						},
					).finished;
				}
				if (stopped) return;
				await dots.animate(
					[
						{
							transform: "scale(1)",
						},
						{
							transform: "scale(1.1)",
						},
					],
					{
						delay: 250 + breathGap,
						duration: 500,
						easing: "ease-in-out",
					},
				).finished;
				if (stopped) return;
				await dots.animate(
					[
						{
							transform: "scale(1.1)",
							opacity: "1.0",
						},
						{
							transform: "scale(0.5)",
							opacity: "0.0",
						},
					],
					{
						duration: 250,
						easing: "ease-in",
					},
				).finished;
				dots.style.opacity = "0.0";
			})();

			return () => {
				stopped = true;
			};
		}
	}, [selected, duration]);

	return (
		<div
			className={classname("am-lyric-dots", {
				"am-lyric-dots-selected": selected && duration !== 0,
				"am-lyric-line-before": offset < 0,
				"am-lyric-line-after": offset > 0,
				"am-lyric-line-selected": selected,
				[`am-lyric-line-o${offset}`]: Math.abs(offset) < 5,
			})}
			style={{
				transform: `translateY(${lineTransform.top}px) scale(${lineTransform.scale})`,
				transitionDelay: offset > 0 && offset < 10 ? `${offset * 20}ms` : "",
				transitionDuration: `${lineTransform.duration}ms`,
			}}
			{...props}
		>
			<div ref={dotsRef}>
				<div ref={dot0} />
				<div ref={dot1} />
				<div ref={dot2} />
			</div>
		</div>
	);
};

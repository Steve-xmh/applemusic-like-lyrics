import { classname } from "../../api";
import { Group, Tween } from "../../libs/tweenjs";
import * as React from "react";
import { LyricLineTransform } from ".";

export const LyricDots: React.FC<
	{
		selected: boolean;
		time: number;
		duration: number;
		offset: number;
		lineTransform: LyricLineTransform;
	} & React.HTMLAttributes<HTMLDivElement>
> = ({ selected, time: _time, duration, offset, lineTransform, ...props }) => {
	const dot0 = React.useRef<HTMLDivElement>(null);
	const dot1 = React.useRef<HTMLDivElement>(null);
	const dot2 = React.useRef<HTMLDivElement>(null);
	const tween = React.useRef<Group | null>(null);

	React.useLayoutEffect(() => {
		if (
			dot0.current &&
			dot1.current &&
			dot2.current &&
			selected &&
			duration !== 0
		) {
			const cdot0 = dot0.current;
			const cdot1 = dot1.current;
			const cdot2 = dot2.current;
			cdot0.style.opacity = "0.5";
			cdot1.style.opacity = "0.5";
			cdot2.style.opacity = "0.5";
			const newGroup = new Group();
			const onFrame = (time: number) => {
				if (tween.current) {
					newGroup.update(time);
					setTimeout(onFrame, 100);
				} else {
					newGroup.removeAll();
				}
			};
			const dotDuration = duration - 750; // 减去原歌词动画的动画时长

			new Tween(
				{
					o: 0.5,
				},
				newGroup,
			)
				.delay(750)
				.to(
					{
						o: 1,
					},
					dotDuration / 3,
				)
				.onStart((o) => {
					cdot0.style.opacity = o.o.toString();
				})
				.onUpdate((o) => {
					cdot0.style.opacity = o.o.toString();
				})
				.start();
			new Tween(
				{
					o: 0.5,
				},
				newGroup,
			)
				.delay(750 + dotDuration / 3)
				.to(
					{
						o: 1,
					},
					dotDuration / 3,
				)
				.onStart((o) => {
					cdot1.style.opacity = o.o.toString();
				})
				.onUpdate((o) => {
					cdot1.style.opacity = o.o.toString();
				})
				.start();
			new Tween(
				{
					o: 0.5,
				},
				newGroup,
			)
				.delay(750 + (dotDuration / 3) * 2)
				.to(
					{
						o: 1,
					},
					dotDuration / 3,
				)
				.onStart((o) => {
					cdot2.style.opacity = o.o.toString();
				})
				.onUpdate((o) => {
					cdot2.style.opacity = o.o.toString();
				})
				.start();
			tween.current = newGroup;
			setTimeout(onFrame, 100);
		} else if (tween.current) {
			tween.current.removeAll();
			tween.current = null;
		}
		return () => {
			if (tween.current) {
				tween.current.removeAll();
				tween.current = null;
			}
		};
	}, [selected, duration]);

	return duration === 0 ? (
		<></>
	) : (
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
			<div ref={dot0} />
			<div ref={dot1} />
			<div ref={dot2} />
		</div>
	);
};

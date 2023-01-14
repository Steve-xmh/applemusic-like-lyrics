import { classname } from "../api";
import { Group, Tween } from "../tweenjs";
import * as React from "react";

export const LyricDots: React.FC<{
	selected: boolean;
	time: number;
	duration: number;
	offset: number;
}> = (props) => {
	const dot0 = React.useRef<HTMLDivElement>(null);
	const dot1 = React.useRef<HTMLDivElement>(null);
	const dot2 = React.useRef<HTMLDivElement>(null);
	const tween = React.useRef<Group | null>(null);

	React.useEffect(() => {
		if (
			dot0.current &&
			dot1.current &&
			dot2.current &&
			props.selected &&
			props.duration !== 0
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
					requestAnimationFrame(onFrame);
				} else {
					newGroup.removeAll();
				}
			};
			const dotDuration = props.duration - 750; // 减去原歌词动画的动画时长

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
			requestAnimationFrame(onFrame);
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
	}, [props.selected, props.duration]);

	return props.duration === 0 ? (
		<></>
	) : (
		<div
			className={classname("am-lyric-dots", {
				"am-lyric-dots-selected": props.selected && props.duration !== 0,
				"am-lyric-line-before": props.offset < 0,
				"am-lyric-line-after": props.offset > 0,
				"am-lyric-line-selected": props.selected,
				[`am-lyric-line-o${props.offset}`]: Math.abs(props.offset) < 5,
			})}
		>
			<div ref={dot0} />
			<div ref={dot1} />
			<div ref={dot2} />
		</div>
	);
};

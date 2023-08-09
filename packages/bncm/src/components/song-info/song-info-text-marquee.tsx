import "./song-info-text-marquee.sass";
import { FC, PropsWithChildren, useEffect, useRef } from "react";

export const SongInfoTextMarquee: FC<PropsWithChildren> = (props) => {
	const outerDiv = useRef<HTMLDivElement>(null);
	const innerDiv = useRef<HTMLDivElement>(null);
	const currentAnimationsRef = useRef(new Set<Animation>());

	useEffect(() => {}, []);

	const onMouseEnter = () => {
		if (innerDiv.current && outerDiv.current) {
			const outerWidth = outerDiv.current.clientWidth;
			const innerWidth = innerDiv.current.clientWidth;

			if (innerWidth <= outerWidth * 0.95) {
				return;
			}

			outerDiv.current?.classList.add("animating");

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
				outerDiv.current?.classList.remove("animating");
			});

			currentAnimationsRef.current.add(ani);
		}
	};

	const onMouseLeave = () => {
		for (const ani of currentAnimationsRef.current) {
			ani.finish();
		}
		outerDiv.current?.classList.remove("animating");
		currentAnimationsRef.current.clear();
	};

	return (
		<div
			ref={outerDiv}
			className="amll-song-info-text-marquee"
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			<div ref={innerDiv}>{props.children}</div>
		</div>
	);
};

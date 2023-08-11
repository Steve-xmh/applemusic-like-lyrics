import "./menu.sass";
import {
	FC,
	PropsWithChildren,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

export const Menu: FC<
	PropsWithChildren<{
		opened: boolean;
		hasCheckBoxMenuItems?: boolean;
		onClose: () => void;
	}>
> = (props) => {
	const menuRef = useRef<HTMLDivElement>(null);
	const posRef = useRef([0, 0]);
	const [pos, setPos] = useState([0, 0]);

	useLayoutEffect(() => {
		const menu = menuRef.current;
		if (menu) {
			const onRightClick = (evt: MouseEvent) => {
				const box = menu.getBoundingClientRect();
				let x = evt.clientX;
				let y = evt.clientY;
				if (x > box.width && x + box.width >= window.innerWidth) {
					x -= box.width;
				}
				if (y > box.height && y + box.height >= window.innerHeight) {
					y -= box.height;
				}
				posRef.current = [x, y];
			};
			window.addEventListener("mousemove", onRightClick);
			return () => {
				window.addEventListener("mousemove", onRightClick);
			};
		} else {
			setPos([0, 0]);
		}
	}, [props.opened, menuRef.current]);

	useLayoutEffect(() => {
		if (props.opened) {
			setPos(posRef.current);
		}
	}, [props.opened]);

	return (
		// rome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			style={{
				display: props.opened ? "block" : "none",
				position: "fixed",
				left: "0",
				top: "0",
				width: "100%",
				height: "100%",
				zIndex: "999",
				backgroundColor: "transparent",
			}}
			className="amll-menu-wrapper"
			onClick={(evt) => {
				if (evt.target === evt.currentTarget) {
					props.onClose();
				}
			}}
		>
			{/* rome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
			<div
				style={{
					position: "fixed",
					left: `${pos[0]}px`,
					top: `${pos[1]}px`,
				}}
				className={
					props.hasCheckBoxMenuItems
						? "appkit-menu with-checkbox"
						: "appkit-menu"
				}
				ref={menuRef}
				onClick={(evt) => evt.stopPropagation()}
			>
				<div>{props.children}</div>
			</div>
		</div>
	);
};

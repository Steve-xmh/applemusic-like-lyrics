import { useMouse } from "@mantine/hooks";
import * as React from "react";
import { createPortal } from "react-dom";

export const Menu: React.FC<
	React.PropsWithChildren<{
		opened: boolean;
		hasCheckBoxMenuItems?: boolean;
		onClose: () => void;
	}>
> = (props) => {
	const menuRef = React.useRef<HTMLDivElement>(null);
	const mouse = useMouse();
	const [pos, setPos] = React.useState([0, 0]);

	React.useLayoutEffect(() => {
		const menu = menuRef.current;
		if (menu) {
			const box = menu.getBoundingClientRect();
			let { x, y } = mouse;
			if (
				x + box.width >= window.innerWidth / window.devicePixelRatio ||
				x > window.innerWidth / window.devicePixelRatio / 2
			) {
				x -= box.width;
			}
			if (
				y + box.height >= window.innerHeight / window.devicePixelRatio ||
				y > window.innerHeight / window.devicePixelRatio / 2
			) {
				y -= box.height;
			}
			setPos([x, y]);
		} else {
			setPos([0, 0]);
		}
	}, [props.opened, menuRef.current]);

	return createPortal(
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
			onClickCapture={props.onClose}
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
		</div>,
		document.body,
	);
};

import "./menu.sass";
import {
	FC,
	PropsWithChildren,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createPortal } from "react-dom";

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
		const onRightClick = (evt: MouseEvent) => {
			posRef.current = [evt.clientX, evt.clientY];
		};
		window.addEventListener("mousemove", onRightClick);
		return () => {
			window.addEventListener("mousemove", onRightClick);
		};
	}, [menuRef.current]);

	useLayoutEffect(() => {
		const menu = menuRef.current;
		if (props.opened && menu) {
			const box = menu.getBoundingClientRect();
			let [x, y] = posRef.current;
			if (x + box.width >= window.innerWidth) {
				x = window.innerWidth - box.width;
			}
			if (y + box.height >= window.innerHeight) {
				y = window.innerHeight - box.height;
			}
			setPos([x, y]);
		}
	}, [props.opened]);

	return createPortal(
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			style={{
				display: props.opened ? "block" : "none",
				position: "fixed",
				left: "0",
				top: "0",
				width: "100%",
				height: "100%",
				zIndex: "2000",
				backgroundColor: "transparent",
			}}
			className="amll-menu-wrapper"
			onClick={(evt) => {
				if (evt.target === evt.currentTarget) {
					props.onClose();
					evt.stopPropagation();
				}
			}}
		>
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
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

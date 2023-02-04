import * as React from "react";
import { createPortal } from "react-dom";
import { classname } from "../../../api";

const MenuLevelProvider = React.createContext(0);

export const MenuItem: React.FC<
	React.PropsWithChildren<{
		checked?: boolean;
		label: string;
		labelOnly?: boolean;
		_zindex?: number;
		onClick?: () => void;
	}>
> = (props) => {
	const zindex = React.useContext(MenuLevelProvider) || 999;
	const menuItemRef = React.useRef<HTMLButtonElement>(null);
	const subMenuRef = React.useRef<HTMLDivElement>(null);
	const [buttonHover, setButtonHover] = React.useState(false);
	const [subMenuHover, setSubMenuHover] = React.useState(false);
	const [pos, setPos] = React.useState([0, 0]);

	React.useEffect(() => {
		const menuItem = menuItemRef.current;
		const subMenu = subMenuRef.current;
		if (menuItem && subMenu) {
			const menuItemSize = menuItem.getBoundingClientRect();
			const subMenuSize = subMenu.getBoundingClientRect();
			const width = window.innerWidth;
			const height = window.innerHeight;
			let x = menuItemSize.right - 6;
			let y = menuItemSize.top - 7;

			if (menuItemSize.right + subMenuSize.width >= width) {
				x = menuItemSize.left - subMenuSize.width + 6;
			}

			if (menuItemSize.bottom + subMenuSize.height >= height) {
				if (menuItemSize.bottom - subMenuSize.height > 0) {
					y = menuItemSize.bottom - subMenuSize.height + 7;
				} else {
					y = window.innerHeight * 0.1;
				}
			}

			setPos([x, y]);
		}
	}, [props.children, buttonHover]);

	return (
		<button
			ref={menuItemRef}
			className={classname("appkit-menu-item", {
				checked: !!props.checked,
				"label-only": !!props.labelOnly,
				"has-submenu": !!props.children,
			})}
			onClick={(evt) => {
				const onClick = props.onClick;
				if (onClick) onClick();
				evt.stopPropagation();
			}}
			onMouseEnter={() => setButtonHover(true)}
			onMouseLeave={() => setButtonHover(false)}
		>
			{props.children &&
				createPortal(
					<MenuLevelProvider.Provider value={zindex + 1}>
						<div
							ref={subMenuRef}
							className={"appkit-menu is-submenu"}
							style={{
								left: pos[0],
								top: pos[1],
								zIndex: zindex + 1,
								visibility: buttonHover || subMenuHover ? undefined : "hidden",
							}}
							onMouseEnter={() => setSubMenuHover(true)}
							onMouseLeave={() => setSubMenuHover(false)}
						>
							<div>{props.children}</div>
						</div>
					</MenuLevelProvider.Provider>,
					document.body,
				)}
			{props.label}
		</button>
	);
};

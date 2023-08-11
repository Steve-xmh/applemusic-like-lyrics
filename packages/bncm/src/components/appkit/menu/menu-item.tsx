import "./menu-item.sass";
import {
	FC,
	PropsWithChildren,
	createContext,
	useContext,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import classnames from "classnames";

const MenuLevelProvider = createContext(0);

export const MenuItem: FC<
	PropsWithChildren<{
		checked?: boolean;
		label: string;
		labelOnly?: boolean;
		_zindex?: number;
		onClick?: () => void;
	}>
> = (props) => {
	const zindex = useContext(MenuLevelProvider) || 999;
	const menuItemRef = useRef<HTMLButtonElement>(null);
	const subMenuRef = useRef<HTMLDivElement>(null);
	const [buttonHover, setButtonHover] = useState(false);
	const [subMenuHover, setSubMenuHover] = useState(false);
	const [pos, setPos] = useState([0, 0]);

	useLayoutEffect(() => {
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
			type="button"
			className={classnames("appkit-menu-item", {
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
			{props.children && (
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
				</MenuLevelProvider.Provider>
			)}
			{props.label}
		</button>
	);
};

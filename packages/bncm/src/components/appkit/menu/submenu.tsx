import { FC, PropsWithChildren } from "react";
import classnames from "classnames";

export const SubMenu: FC<
	PropsWithChildren<{
		checked?: boolean;
		label: string;
		onClick?: () => void;
	}>
> = (props) => {
	return (
		<>
			<button
				type="button"
				className={classnames("appkit-menu-item", {
					checked: !!props.checked,
					"has-submenu": !!props.children,
				})}
				onClickCapture={props.onClick}
			>
				{props.children && (
					<div className="appkit-menu is-submenu">
						<div>{props.children}</div>
					</div>
				)}
				{props.label}
			</button>
		</>
	);
};

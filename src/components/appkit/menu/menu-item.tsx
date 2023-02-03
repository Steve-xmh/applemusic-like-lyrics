import * as React from "react";
import { classname } from "../../../api";

export const MenuItem: React.FC<
	React.PropsWithChildren<{
		checked?: boolean;
		label: string;
		onClick?: () => void;
	}>
> = (props) => {
	return (
		<>
			<button
				className={classname("appkit-menu-item", {
					checked: !!props.checked,
					"has-submenu": !!props.children,
				})}
				onClick={props.onClick}
			>
				<div className="hover-highlight" />
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

import { memo, type HTMLProps } from "react";
import IconMore from "./icon_more.svg?react";
import styles from "./index.module.css";
import classNames from "classnames";

export const MenuButton: React.FC<HTMLProps<HTMLButtonElement>> = memo(
	({ className, type, ...rest }) => {
		return (
			<button
				className={classNames(styles.menuButton, className)}
				type="button"
				{...rest}
			>
				<IconMore />
			</button>
		);
	},
);

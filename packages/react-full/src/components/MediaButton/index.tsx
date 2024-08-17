import type { FC, HTMLProps, PropsWithChildren } from "react";
import classNames from "classnames";
import styles from "./index.module.css";

export const MediaButton: FC<
	PropsWithChildren<HTMLProps<HTMLButtonElement>>
> = ({ className, children, type, ...rest }) => {
	return (
		<button
			className={classNames(styles.mediaButton, className)}
			type="button"
			{...rest}
		>
			{children}
		</button>
	);
};

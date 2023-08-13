import { FC, HTMLProps, PropsWithChildren } from "react";
import "./alert.sass";
import classNames from "classnames";

export interface AlertProps {
	title?: string;
	content?: string;
	type?: "info" | "success" | "warning" | "error";
}

export const Alert: FC<
	PropsWithChildren<
		AlertProps & Omit<HTMLProps<HTMLDivElement>, keyof AlertProps>
	>
> = ({ title, className, children, type, content, ...props }) => {
	return (
		<div className={classNames("appkit-alert", type, className)} {...props}>
			{title && <div className="appkit-alert-title">{title}</div>}
			{content}
			{children}
		</div>
	);
};

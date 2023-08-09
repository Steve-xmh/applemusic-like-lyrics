import "./text-field.sass";
import { FC, HTMLProps, PropsWithRef } from "react";

export const TextField: FC<PropsWithRef<HTMLProps<HTMLInputElement>>> = ({
	className,
	...props
}) => {
	return <input className={"appkit-text-field " + className} {...props} />;
};

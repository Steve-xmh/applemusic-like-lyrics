import "./group-box.sass";
import { HTMLProps } from "react";

export const GroupBox: React.FC<
	React.PropsWithChildren<HTMLProps<HTMLDivElement>>
> = ({ className, ...props }) => {
	return <div className={"appkit-group-box " + className} {...props} />;
};

export const GroupBoxDevider: React.FC = () => {
	return <div className="appkit-group-box-devider" />;
};

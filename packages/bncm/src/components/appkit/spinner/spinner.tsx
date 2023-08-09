import "./spinner.sass";
import { FC } from "react";

export const Spinner: FC<{
	size?: string;
}> = (props) => {
	return (
		<span
			className="appkit-spinner"
			style={{
				padding: props.size || "10px",
			}}
		>
			<div />
			<div />
			<div />
			<div />
			<div />
			<div />
			<div />
			<div />
			<div />
			<div />
			<div />
			<div />
		</span>
	);
};

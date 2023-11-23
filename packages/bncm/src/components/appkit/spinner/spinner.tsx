import "./spinner.sass";
import { FC } from "react";

export const FullSpinner: FC<{
	size?: string;
}> = (props) => {
	return (
		<div
			style={{
				display: "flex",
				height: "100%",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<Spinner size={props.size} />
		</div>
	);
};

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

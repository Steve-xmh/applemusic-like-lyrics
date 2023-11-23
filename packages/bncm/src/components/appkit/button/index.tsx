import "./button.sass";

export const Button: React.FC<
	React.PropsWithChildren<
		{
			accent?: boolean;
			disabled?: boolean;
		} & React.HTMLAttributes<HTMLButtonElement>
	>
> = (props) => {
	const { className, accent, children, ...others } = props;
	return (
		<button
			type="button"
			className={`appkit-button ${accent ? "accent" : ""} ${className || ""}`}
			{...others}
		>
			{children}
		</button>
	);
};

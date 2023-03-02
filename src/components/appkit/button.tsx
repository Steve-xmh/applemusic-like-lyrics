export const Button: React.FC<
	React.PropsWithChildren<{
		accent?: boolean;
	}>
> = (props) => {
	return (
		<button className={`appkit-button ${props.accent ? "accent" : ""}`}>
			{props.children}
		</button>
	);
};

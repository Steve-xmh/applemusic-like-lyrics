import "./switch.sass";

export const Switch: React.FC<
	React.PropsWithChildren<{
		selected?: boolean;
		disabled?: boolean;
		onClick?: () => void;
		beforeSwitch?: React.ReactNode;
		afterSwitch?: React.ReactNode;
	}>
> = (props) => {
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			onClick={props.onClick}
			className={`appkit-switch ${props.selected ? "selected" : ""}`}
		>
			{props.beforeSwitch}
			<div className="appkit-switch-inner">
				<div />
			</div>
			{props.afterSwitch}
		</div>
	);
};

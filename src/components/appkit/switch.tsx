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

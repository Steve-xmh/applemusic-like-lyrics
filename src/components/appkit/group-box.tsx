export const GroupBox: React.FC<React.PropsWithChildren> = (props) => {
	return <div className="appkit-group-box">{props.children}</div>;
};

export const GroupBoxDevider: React.FC = () => {
	return <div className="appkit-group-box-devider" />;
};

import ReactSlider from "react-slider";
import type { ReactSliderProps } from "react-slider";

export const Slider: React.FC<ReactSliderProps> = (props) => {
	const { className, ...others } = props;
	return (
		<ReactSlider className={`appkit-slider ${className || ""}`} {...others} />
	);
};

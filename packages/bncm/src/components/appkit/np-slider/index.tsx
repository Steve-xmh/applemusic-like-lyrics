import "./np-slider.sass"
import ReactSlider from "react-slider";
import type { ReactSliderProps } from "react-slider";

export const NowPlayingSlider: React.FC<ReactSliderProps> = (props) => {
	const { className, ...others } = props;
	return (
		<ReactSlider
			className={`appkit-now-playing-slider ${className || ""}`}
			{...others}
		/>
	);
};

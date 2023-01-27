import { classname } from "../api";
import { useConfigBoolean } from "../api/react";

export const LyricPlayerTopBar: React.FC<{
	isFullScreen: boolean;
	onSetFullScreen: (shouldFullScreent: boolean) => void;
}> = (props) => {
	const [configTranslatedLyric, setConfigTranslatedLyric] = useConfigBoolean(
		"translated-lyric",
		true,
	);
	const [configDynamicLyric, setConfigDynamicLyric] = useConfigBoolean(
		"dynamic-lyric",
		false,
	);
	const [configRomanLyric, setConfigRomanLyric] = useConfigBoolean(
		"roman-lyric",
		true,
	);

	return (
		<div className="am-lyric-options">
			<button
				onClick={() => {
					setConfigTranslatedLyric(!configTranslatedLyric);
				}}
				className={classname({
					toggled: configTranslatedLyric,
				})}
				type="button"
			>
				译
			</button>
			<button
				onClick={() => {
					setConfigRomanLyric(!configRomanLyric);
				}}
				className={classname({
					toggled: configRomanLyric,
				})}
				type="button"
			>
				音
			</button>
			<button
				onClick={() => {
					setConfigDynamicLyric(!configDynamicLyric);
				}}
				className={classname({
					toggled: configDynamicLyric,
				})}
				type="button"
			>
				逐词歌词
			</button>
			<button
				onClick={() => {
					props.onSetFullScreen(!props.isFullScreen);
				}}
				className={classname({
					toggled: props.isFullScreen,
				})}
				type="button"
			>
				全屏
			</button>
		</div>
	);
};

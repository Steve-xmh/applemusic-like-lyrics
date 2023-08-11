import { FC } from "react";
import { NowPlayingSlider } from "../components/appkit/np-slider";
import IconSpeaker from "../assets/icon_speaker.svg";
import IconSpeaker3 from "../assets/icon_speaker_3.svg";
import { useAtom } from "jotai";
import { currentVolumeAtom } from "../music-context/wrapper";

export const VolumeControl: FC = () => {
	const [volume, setVolume] = useAtom(currentVolumeAtom);

	return (
		<div className="am-music-volume-controls">
			<IconSpeaker color="#FFFFFF" />
			<NowPlayingSlider
				onChange={setVolume}
				value={volume}
				step={0.01}
				min={0.0}
				max={1.0}
			/>
			<IconSpeaker3 color="#FFFFFF" />
		</div>
	);
};

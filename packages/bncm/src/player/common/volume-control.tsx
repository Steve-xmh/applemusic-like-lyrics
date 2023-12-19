import { FC, useEffect, useRef } from "react";
import { Slider } from "../../components/appkit/np-slider";
import IconSpeaker from "../../assets/icon_speaker.svg?react";
import IconSpeaker3 from "../../assets/icon_speaker_3.svg?react";
import { useAtom } from "jotai";
import { currentVolumeAtom } from "../../music-context/wrapper";
import "./volume-control.sass";

export const VolumeControl: FC = () => {
	const [volume, setVolume] = useAtom(currentVolumeAtom);
	const lastVolumeRef = useRef(volume);
	const minSpeakerRef = useRef<SVGSVGElement>(null);
	const maxSpeakerRef = useRef<SVGSVGElement>(null);

	useEffect(() => {
		if (lastVolumeRef.current !== volume) {
			lastVolumeRef.current = volume;
			if (volume === 0 && minSpeakerRef.current) {
				minSpeakerRef.current.classList.remove("speaker-animate");
				requestAnimationFrame(() => {
					minSpeakerRef.current?.classList?.add("speaker-animate");
				});
			} else if (volume === 1 && maxSpeakerRef.current) {
				maxSpeakerRef.current.classList.remove("speaker-animate");
				requestAnimationFrame(() => {
					maxSpeakerRef.current?.classList?.add("speaker-animate");
				});
			}
		}
	}, [volume]);

	return (
		<Slider
			className="am-music-volume-controls"
			beforeIcon={<IconSpeaker ref={minSpeakerRef} color="#FFFFFF" />}
			onChange={setVolume}
			value={volume}
			step={0.01}
			min={0.0}
			max={1.0}
			afterIcon={<IconSpeaker3 ref={maxSpeakerRef} color="#FFFFFF" />}
		/>
	);
};

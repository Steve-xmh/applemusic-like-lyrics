import { useAtomValue } from "jotai";
import TagLossless from "../../assets/tag_lossless.svg";
import TagHiresLossless from "../../assets/tag_hires_lossless.svg";
import IconDolbyAtmos from "../../assets/icon_dolby_atmos.svg";
import { FC } from "react";
import { AudioQualityType } from "../../music-context";
import { musicQualityAtom } from "../../music-context/wrapper";

export const AudioQualityTag: FC = () => {
	const currentAudioQualityType = useAtomValue(musicQualityAtom);
	return (
		<div className="am-music-quality">
			{currentAudioQualityType === AudioQualityType.Lossless && (
				<div>
					<TagLossless />
				</div>
			)}
			{currentAudioQualityType === AudioQualityType.HiRes && (
				<div>
					<TagHiresLossless />
				</div>
			)}
			{currentAudioQualityType === AudioQualityType.DolbyAtmos && (
				<div>
					<IconDolbyAtmos />
				</div>
			)}
		</div>
	);
};

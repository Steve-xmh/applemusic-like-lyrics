import { useAtomValue } from "jotai";
import TagLossless from "../../assets/tag_lossless.svg?react";
import TagHiresLossless from "../../assets/tag_hires_lossless.svg?react";
import IconDolbyAtmos from "../../assets/icon_dolby_atmos.svg?react";
import { FC } from "react";
import { AudioQualityType } from "../../music-context";
import { musicQualityAtom } from "../../music-context/wrapper";

export const AudioQualityTag: FC = () => {
	const currentAudioQualityType = useAtomValue(musicQualityAtom);
	return (
		<div className="am-music-quality">
			{currentAudioQualityType === AudioQualityType.Lossless && <TagLossless />}
			{currentAudioQualityType === AudioQualityType.HiRes && (
				<TagHiresLossless />
			)}
			{currentAudioQualityType === AudioQualityType.DolbyAtmos && (
				<IconDolbyAtmos />
			)}
		</div>
	);
};

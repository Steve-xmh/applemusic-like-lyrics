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

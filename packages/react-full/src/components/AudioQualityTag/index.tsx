import TagLossless from "./tag_lossless.svg?react";
import TagHiresLossless from "./tag_hires_lossless.svg?react";
import IconDolbyAtmos from "./icon_dolby_atmos.svg?react";
import type { FC, HTMLProps } from "react";
import { AudioQualityType } from "../../states/music";

export const AudioQualityTag: FC<
	{
		quality: AudioQualityType;
	} & HTMLProps<HTMLDivElement>
> = ({ quality, ...rest }) => {
	return (
		<div {...rest}>
			{quality === AudioQualityType.Lossless && <TagLossless />}
			{quality === AudioQualityType.HiRes && <TagHiresLossless />}
			{quality === AudioQualityType.DolbyAtmos && <IconDolbyAtmos />}
		</div>
	);
};

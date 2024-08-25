import TagLossless from "./tag_lossless.svg?react";
import TagHiresLossless from "./tag_hires_lossless.svg?react";
import IconDolbyAtmos from "./icon_dolby_atmos.svg?react";
import { memo, type FC, type HTMLProps } from "react";
import { AudioQualityType } from "../../states/music";

export const AudioQualityTag: FC<
	{
		quality: AudioQualityType;
	} & HTMLProps<HTMLDivElement>
> = memo(({ quality, ...rest }) => {
	return (
		<div {...rest}>
			{quality === AudioQualityType.Lossless && <TagLossless />}
			{quality === AudioQualityType.HiRes && <TagHiresLossless />}
			{quality === AudioQualityType.DolbyAtmos && <IconDolbyAtmos />}
		</div>
	);
});

import classNames from "classnames";
import { AnimatePresence, type Variants, motion } from "framer-motion";
import { type FC, type HTMLProps, memo } from "react";
import { AudioQualityType } from "../../states/music";
import IconDolbyAtmos from "./icon_dolby_atmos.svg?react";
import styles from "./index.module.css";
import TagHiresLossless from "./tag_hires_lossless.svg?react";
import TagLossless from "./tag_lossless.svg?react";

const COMMON_VARIENTS: Variants = {
	hide: {
		opacity: 0,
		scale: 0.8,
		transition: {
			duration: 0.25,
			ease: "circIn",
		},
	},
	show: {
		opacity: 1,
		scale: 1,
		transition: {
			duration: 1,
			ease: [0, 0.71, 0.2, 1.01],
		},
	},
};

const DOLBY_VARIENTS: Variants = {
	hide: {
		opacity: 0,
		scale: 0.8,
		transition: {
			duration: 0.25,
			ease: "circIn",
		},
	},
	show: {
		opacity: [0, 1],
		scale: 1,
		transition: {
			duration: 1,
			ease: [0, 0.71, 0.2, 1.01],
		},
	},
};

export const AudioQualityTag: FC<
	{
		quality: AudioQualityType;
	} & HTMLProps<HTMLDivElement>
> = memo(({ quality, className, ...rest }) => {
	return (
		<div className={classNames(className, styles.audioQualityTag)} {...rest}>
			<AnimatePresence mode="wait">
				{quality === AudioQualityType.Lossless && (
					<motion.div
						initial="hide"
						animate="show"
						exit="hide"
						variants={COMMON_VARIENTS}
					>
						<TagLossless />
					</motion.div>
				)}
				{quality === AudioQualityType.HiRes && (
					<motion.div
						initial="hide"
						animate="show"
						exit="hide"
						variants={COMMON_VARIENTS}
					>
						<TagHiresLossless />
					</motion.div>
				)}
				{quality === AudioQualityType.DolbyAtmos && (
					<motion.div
						initial="hide"
						animate="show"
						exit="hide"
						className={styles.dolbyLogo}
						variants={DOLBY_VARIENTS}
					>
						<IconDolbyAtmos className={styles.dolbyLogoGlow} />
						<IconDolbyAtmos />
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
});

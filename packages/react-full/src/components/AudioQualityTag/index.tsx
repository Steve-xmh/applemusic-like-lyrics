import classNames from "classnames";
import { type Variants, motion } from "framer-motion";
import { type FC, type HTMLProps, memo } from "react";
import IconDolbyAtmos from "./icon_dolby_atmos.svg?react";
import LoselessIcon from "./icon_loseless.svg?react";
import styles from "./index.module.css";

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
		isDolbyAtmos?: boolean;
		tagText?: string;
		tagIcon?: boolean;
	} & HTMLProps<HTMLDivElement>
> = memo(({ tagText, tagIcon, isDolbyAtmos, className, onClick, ...rest }) => {
	return (
		<div
			className={classNames(
				className,
				styles.audioQualityTag,
				onClick && styles.clickable,
			)}
			onClick={onClick}
			{...rest}
		>
			{isDolbyAtmos ? (
				<motion.div
					key="dolby-atmos"
					initial="hide"
					animate="show"
					exit="hide"
					className={styles.dolbyLogo}
					variants={DOLBY_VARIENTS}
				>
					<IconDolbyAtmos className={styles.dolbyLogoGlow} />
					<IconDolbyAtmos />
				</motion.div>
			) : (
				<motion.div
					key={`common-tag-${tagIcon}-${tagText}`}
					initial="hide"
					animate="show"
					exit="hide"
					variants={COMMON_VARIENTS}
				>
					<div className={styles.commonTag}>
						{tagIcon && <LoselessIcon height="11px" />}
						{tagText && <div className={styles.commonTagText}>{tagText}</div>}
					</div>
				</motion.div>
			)}
		</div>
	);
});

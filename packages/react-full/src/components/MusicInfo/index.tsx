import type { HTMLProps } from "react";
import { MenuButton } from "../MenuButton";
import { TextMarquee } from "../TextMarquee";
import styles from "./index.module.css";
import classNames from "classnames";

export const MusicInfo: React.FC<
	{
		name?: string;
		artists?: string[];
		album?: string;
		onArtistClicked?: (artist: string, index: number) => void;
		onAlbumClicked?: () => void;
		onMenuButtonClicked?: () => void;
	} & HTMLProps<HTMLDivElement>
> = ({
	name,
	artists,
	album,
	onArtistClicked,
	onAlbumClicked,
	onMenuButtonClicked,
	className,
	...rest
}) => {
	return (
		<div className={classNames(styles.musicInfo, className)} {...rest}>
			<div className={styles.info}>
				<TextMarquee className={styles.name}>{name || ""}</TextMarquee>
				<TextMarquee className={styles.artists}>{artists}</TextMarquee>
				<TextMarquee className={styles.album}>{album}</TextMarquee>
			</div>
			<MenuButton onClick={onMenuButtonClicked} />
		</div>
	);
};

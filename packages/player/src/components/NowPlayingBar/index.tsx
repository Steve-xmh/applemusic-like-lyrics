import {
	TextMarquee,
	MediaButton,
	musicArtistsAtom,
	musicCoverAtom,
	musicNameAtom,
	musicPlayingAtom,
	onPlayOrResumeAtom,
	onRequestNextSongAtom,
	onRequestPrevSongAtom,
	isLyricPageOpenedAtom,
} from "@applemusic-like-lyrics/react-full";
import {
	ListBulletIcon,
	PlayIcon,
	PauseIcon,
	TrackPreviousIcon,
	TrackNextIcon,
} from "@radix-ui/react-icons";
import { Container, Flex, IconButton } from "@radix-ui/themes";
import { useAtomValue, useSetAtom } from "jotai";
import type { FC } from "react";
import lyricIcon from "@iconify/icons-ic/round-lyrics";
import { Icon } from "@iconify/react";
import IconPlay from "../../assets/icon_play.svg?react";
import IconPause from "../../assets/icon_pause.svg?react";
import IconForward from "../../assets/icon_forward.svg?react";
import IconRewind from "../../assets/icon_rewind.svg?react";
import styles from "./index.module.css";

export const NowPlayingBar: FC = () => {
	const musicName = useAtomValue(musicNameAtom);
	const musicArtists = useAtomValue(musicArtistsAtom);
	const musicPlaying = useAtomValue(musicPlayingAtom);
	const musicCover = useAtomValue(musicCoverAtom);
	const setLyricPageOpened = useSetAtom(isLyricPageOpenedAtom);

	const onPlayOrResume = useAtomValue(onPlayOrResumeAtom).onEmit;
	const onRequestPrevSong = useAtomValue(onRequestPrevSongAtom).onEmit;
	const onRequestNextSong = useAtomValue(onRequestNextSongAtom).onEmit;

	return (
		<Container position="fixed" bottom="0" left="0" right="0">
			<Flex className={styles.playBar} overflow="hidden">
				<Flex
					direction="row"
					justify="center"
					align="center"
					flexGrow="1"
					flexBasis="33.3%"
				>
					<button
						className={styles.coverButton}
						type="button"
						style={{
							backgroundImage: `url(${musicCover})`,
						}}
						onClick={() => setLyricPageOpened(true)}
					>
						<div className={styles.lyricIconButton}>
							<Icon width={34} icon={lyricIcon} className="icon" />
						</div>
					</button>
					<Flex
						direction="column"
						justify="center"
						ml="4"
						flexGrow="1"
						minWidth="0"
						overflow="hidden"
						style={{
							textWrap: "nowrap",
						}}
					>
						<TextMarquee>{musicName}</TextMarquee>
						<TextMarquee>
							{musicArtists.map((v) => v.name).join(", ")}
						</TextMarquee>
					</Flex>
				</Flex>
				<Flex
					direction="row"
					justify="center"
					align="center"
					flexGrow="1"
					flexBasis="33.3%"
					gap="5"
					display={{
						initial: "none",
						sm: "flex",
					}}
				>
					<MediaButton
						style={{
							scale: "1.5",
						}}
						onClick={onRequestPrevSong}
					>
						<IconRewind
							style={{
								scale: "1.25",
							}}
						/>
					</MediaButton>
					<MediaButton
						style={{
							scale: "1.5",
						}}
						onClick={onPlayOrResume}
					>
						{musicPlaying ? (
							<IconPause
								style={{
									scale: "0.75",
								}}
							/>
						) : (
							<IconPlay
								style={{
									scale: "0.75",
								}}
							/>
						)}
					</MediaButton>
					<MediaButton
						style={{
							scale: "1.5",
						}}
						onClick={onRequestNextSong}
					>
						<IconForward
							style={{
								scale: "1.25",
							}}
						/>
					</MediaButton>
				</Flex>
				<Flex
					direction="row"
					justify="end"
					align="center"
					flexGrow="1"
					flexBasis="33.3%"
					gap="1"
				>
					<IconButton onClick={onRequestPrevSong} variant="soft">
						<TrackPreviousIcon />
					</IconButton>
					<IconButton onClick={onPlayOrResume} variant="soft">
						{musicPlaying ? <PauseIcon /> : <PlayIcon />}
					</IconButton>
					<IconButton onClick={onRequestNextSong} variant="soft">
						<TrackNextIcon />
					</IconButton>
					<IconButton variant="soft">
						<ListBulletIcon />
					</IconButton>
				</Flex>
			</Flex>
		</Container>
	);
};

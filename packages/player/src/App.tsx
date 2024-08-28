import styles from "./App.module.css";
import {
	MediaButton,
	musicArtistsAtom,
	musicCoverAtom,
	musicNameAtom,
	musicPlayingAtom,
	PrebuiltLyricPlayer,
	TextMarquee,
} from "@applemusic-like-lyrics/react-full";
import "@applemusic-like-lyrics/react-full/style.css";
import { Provider, useAtomValue } from "jotai";
import { ErrorBoundary } from "react-error-boundary";
import "./i18n";
import {
	Avatar,
	Container,
	Flex,
	IconButton,
	Theme,
} from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { ListBulletIcon } from "@radix-ui/react-icons";
import IconPlay from "./assets/icon_play.svg?react";
import IconPause from "./assets/icon_pause.svg?react";
import IconForward from "./assets/icon_forward.svg?react";
import IconRewind from "./assets/icon_rewind.svg?react";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";

function ErrorRender({ error, resetErrorBoundary }) {
	console.error(error);
	return (
		<div>
			<h2>An unrecoverable error has occured</h2>
			<code>
				<pre>
					{error.message}
					{error.stack}
				</pre>
			</code>
		</div>
	);
}

function App() {
	const musicName = useAtomValue(musicNameAtom);
	const musicArtists = useAtomValue(musicArtistsAtom);
	const musicPlaying = useAtomValue(musicPlayingAtom);
	const musicCover = useAtomValue(musicCoverAtom);

	return (
		<ErrorBoundary fallbackRender={ErrorRender}>
			<Provider>
				<Theme appearance="dark">
					<>
						<Container mx="9" mb="9">
							<RouterProvider router={router} />
						</Container>
						<Container position="fixed" bottom="0" left="0" right="0">
							<Flex className={styles.playBar} overflow="hidden">
								<Flex
									direction="row"
									justify="center"
									align="center"
									flexGrow="1"
									flexBasis="33.3%"
								>
									<Avatar
										size="5"
										color="gray"
										fallback={<div />}
										src={musicCover}
									/>
									<Flex direction="column" justify="center" ml="4" flexGrow="1">
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
								>
									<MediaButton
										style={{
											scale: "1.5",
										}}
									>
										<IconRewind
											style={{
												scale: "1.5",
											}}
										/>
									</MediaButton>
									<MediaButton
										style={{
											scale: "1.5",
										}}
									>
										{musicPlaying ? <IconPause /> : <IconPlay />}
									</MediaButton>
									<MediaButton
										style={{
											scale: "1.5",
										}}
									>
										<IconForward
											style={{
												scale: "1.5",
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
								>
									<IconButton variant="soft">
										<ListBulletIcon />
									</IconButton>
								</Flex>
							</Flex>
						</Container>
					</>
				</Theme>
				<PrebuiltLyricPlayer
					style={{
						position: "fixed",
						left: "0",
						top: "0",
						width: "100%",
						height: "100%",
						pointerEvents: "none",
						opacity: "0",
					}}
				/>
			</Provider>
		</ErrorBoundary>
	);
}

export default App;

import styles from "./App.module.css";
import {
	MediaButton,
	PrebuiltLyricPlayer,
	TextMarquee,
} from "@applemusic-like-lyrics/react-full";
import "@applemusic-like-lyrics/react-full/style.css";
import { Provider } from "jotai";
import { ErrorBoundary } from "react-error-boundary";
import {
	Avatar,
	Box,
	Button,
	Container,
	Flex,
	Heading,
	Theme,
} from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";

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
	return (
		<ErrorBoundary fallbackRender={ErrorRender}>
			<Provider>
				<Theme appearance="dark">
					<>
						<Container mx="9" mb="9">
							<Heading my="9">AMLL Player</Heading>
						</Container>
						<Container position="fixed" bottom="0" left="0" right="0">
							<Flex className={styles.playBar} overflow="hidden">
								<Flex
									direction="row"
									justify="center"
									flexGrow="1"
									flexBasis="33.3%"
								>
									<Avatar size="5" color="gray" fallback={<div />} />
									<Flex direction="column" justify="center" ml="4" flexGrow="1">
										<TextMarquee>Artist</TextMarquee>
										<TextMarquee>Song Name</TextMarquee>
									</Flex>
								</Flex>
								<Flex
									direction="row"
									justify="center"
									align="center"
									flexGrow="1"
									flexBasis="33.3%"
								>
									<MediaButton></MediaButton>
									<MediaButton></MediaButton>
									<MediaButton></MediaButton>
								</Flex>
								<Flex
									direction="row"
									justify="end"
									align="center"
									flexGrow="1"
									flexBasis="33.3%"
								>
									<Button>Playlist</Button>
								</Flex>
							</Flex>
						</Container>
					</>
				</Theme>
			</Provider>
		</ErrorBoundary>
	);
}

export default App;

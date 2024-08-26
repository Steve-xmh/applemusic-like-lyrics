import styles from "./App.module.css";
import {
	MediaButton,
	PrebuiltLyricPlayer,
	TextMarquee,
} from "@applemusic-like-lyrics/react-full";
import "@applemusic-like-lyrics/react-full/style.css";
import { Provider } from "jotai";
import { ErrorBoundary } from "react-error-boundary";
import { Trans, useTranslation } from "react-i18next";
import "./i18n";
import {
	Avatar,
	Box,
	Button,
	Container,
	Dialog,
	Flex,
	Heading,
	Text,
	TextField,
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
	const { t } = useTranslation();
	
	return (
		<ErrorBoundary fallbackRender={ErrorRender}>
			<Provider>
				<Theme appearance="dark">
					<>
						<Container mx="9" mb="9">
							<Heading my="9">AMLL Player</Heading>
							<Flex
								direction="row"
								justify="center"
								gap="3"
								height="4em"
								align="stretch"
							>
								<Dialog.Root>
									<Dialog.Trigger>
										<Box asChild flexGrow="1" flexBasis="10%" height="100%">
											<Button size="4">新建歌单</Button>
										</Box>
									</Dialog.Trigger>
									<Dialog.Content maxWidth="450px">
										<Dialog.Title>
											<Trans key="newPlaylistDialogTitle">新建歌单</Trans>
										</Dialog.Title>
										<Text as="label">
											<Trans key="newPlaylistDialogLabel">歌单名称</Trans>
										</Text>
										<TextField.Root placeholder="歌单名称" />
									</Dialog.Content>
								</Dialog.Root>
								<Box asChild flexGrow="1" flexBasis="10%" height="100%">
									<Button size="4">
										<Trans key="searchPlaylistButtonText">搜索歌单</Trans>
									</Button>
								</Box>
								<Box asChild flexGrow="1" flexBasis="10%" height="100%">
									<Button size="4">
										<Trans key="settingsButtonText">设置</Trans>
									</Button>
								</Box>
							</Flex>
							<Text mt="9" as="div" align="center">
								没有歌单，快去新建一个吧！
							</Text>
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
								></Flex>
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
				<PrebuiltLyricPlayer style={{
					position: "fixed",
					left: "0",
					top: "0",
					width: "100%",
					height: "100%",
					pointerEvents: "none",
					opacity: "0",
				}} />
			</Provider>
		</ErrorBoundary>
	);
}

export default App;

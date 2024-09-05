import "@applemusic-like-lyrics/react-full/style.css";
import "./i18n";
import { Box, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { MusicContext } from "./components/MusicContext";
import { NowPlayingBar } from "./components/NowPlayingBar";
import { AMLLWrapper } from "./components/AMLLWrapper";
import styles from "./App.module.css";
import classNames from "classnames";
import { useAtomValue } from "jotai";
import { isLyricPageOpenedAtom } from "@applemusic-like-lyrics/react-full";

/*
					<Container
						mx={{
							initial: "4",
							sm: "9",
						}}
						mb="9"
						maxHeight="100vh"
					>
					</Container> */

function App() {
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);
	return (
		<>
			<MusicContext />
			<Theme appearance="dark">
				<Box
					className={classNames(
						styles.body,
						isLyricPageOpened && styles.amllOpened,
					)}
				>
					<Box className={styles.container}>
						<RouterProvider router={router} />
					</Box>
					<NowPlayingBar />
				</Box>
				<AMLLWrapper />
			</Theme>
		</>
	);
}

export default App;

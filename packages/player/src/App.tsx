import { isLyricPageOpenedAtom } from "@applemusic-like-lyrics/react-full";
import "@applemusic-like-lyrics/react-full/style.css";
import { Box, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import classNames from "classnames";
import { useAtomValue } from "jotai";
import { RouterProvider } from "react-router-dom";
import styles from "./App.module.css";
import { AMLLWrapper } from "./components/AMLLWrapper";
import { MusicContext } from "./components/MusicContext";
import { NowPlayingBar } from "./components/NowPlayingBar";
import "./i18n";
import { router } from "./router";

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

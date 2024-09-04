import "@applemusic-like-lyrics/react-full/style.css";
import "./i18n";
import { Container, Theme } from "@radix-ui/themes";
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

function App() {
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);
	return (
		<>
			<MusicContext />
			<Theme
				appearance="dark"
				className={classNames(
					styles.body,
					isLyricPageOpened && styles.amllOpened,
				)}
			>
				<Container
					className={styles.container}
					mx={{
						initial: "4",
						sm: "9",
					}}
					mb="9"
				>
					<RouterProvider router={router} />
				</Container>
				<NowPlayingBar />
			</Theme>
			<AMLLWrapper />
		</>
	);
}

export default App;

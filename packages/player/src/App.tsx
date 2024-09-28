import { isLyricPageOpenedAtom } from "@applemusic-like-lyrics/react-full";
import { Box, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import classNames from "classnames";
import { useAtomValue } from "jotai";
import { useEffect, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Stats from "stats.js";
import styles from "./App.module.css";
import { AMLLWrapper } from "./components/AMLLWrapper";
import { LocalMusicContext } from "./components/LocalMusicContext";
import { NowPlayingBar } from "./components/NowPlayingBar";
import { UpdateContext } from "./components/UpdateContext";
import { WSProtocolMusicContext } from "./components/WSProtocolMusicContext";
import "./i18n";
import { router } from "./router";
import {
	MusicContextMode,
	displayLanguageAtom,
	musicContextModeAtom,
	showStatJSFrameAtom,
} from "./states";

function App() {
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);
	const showStatJSFrame = useAtomValue(showStatJSFrameAtom);
	const musicContextMode = useAtomValue(musicContextModeAtom);
	const displayLanguage = useAtomValue(displayLanguageAtom);
	const { i18n } = useTranslation();

	useLayoutEffect(() => {
		console.log("displayLanguage", displayLanguage, i18n);
		i18n.changeLanguage(displayLanguage);
	}, [i18n, displayLanguage]);

	useEffect(() => {
		if (showStatJSFrame) {
			const stat = new Stats();
			document.body.appendChild(stat.dom);
			stat.dom.style.position = "fixed";
			stat.dom.style.left = "1em";
			stat.dom.style.top = "3em";
			let canceled = false;
			const update = () => {
				if (canceled) return;
				stat.end();
				stat.begin();
				requestAnimationFrame(update);
			};
			requestAnimationFrame(update);
			return () => {
				canceled = true;
				document.body.removeChild(stat.dom);
			};
		}
	}, [showStatJSFrame]);

	return (
		<>
			{musicContextMode === MusicContextMode.Local && <LocalMusicContext />}
			{musicContextMode === MusicContextMode.WSProtocol && (
				<WSProtocolMusicContext />
			)}
			<UpdateContext />
			<Theme
				appearance="dark"
				panelBackground="solid"
				className={styles.radixTheme}
			>
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
				<ToastContainer
					theme="dark"
					position="bottom-right"
					style={{
						marginBottom: "150px",
					}}
				/>
			</Theme>
		</>
	);
}

export default App;

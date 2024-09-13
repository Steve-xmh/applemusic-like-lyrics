import { isLyricPageOpenedAtom } from "@applemusic-like-lyrics/react-full";
import { Box, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import classNames from "classnames";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Stats from "stats.js";
import styles from "./App.module.css";
import { AMLLWrapper } from "./components/AMLLWrapper";
import { MusicContext } from "./components/MusicContext";
import { NowPlayingBar } from "./components/NowPlayingBar";
import { UpdateContext } from "./components/UpdateContext";
import "./i18n";
import { router } from "./router";
import { showStatJSFrameAtom } from "./states";

function App() {
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);
	const showStatJSFrame = useAtomValue(showStatJSFrameAtom);

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
			<MusicContext />
			<UpdateContext />
			<Theme appearance="dark" className={styles.radixTheme}>
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

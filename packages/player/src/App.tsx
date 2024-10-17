import { isLyricPageOpenedAtom } from "@applemusic-like-lyrics/react-full";
import { Box, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { getCurrentWindow } from "@tauri-apps/api/window";
import classNames from "classnames";
import { useAtomValue } from "jotai";
import {
	StrictMode,
	Suspense,
	lazy,
	useEffect,
	useLayoutEffect,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Stats from "stats.js";
import styles from "./App.module.css";
import { ExtensionInjectPoint } from "./components/ExtensionInjectPoint";
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

const ExtensionContext = lazy(() => import("./components/ExtensionContext"));
const AMLLWrapper = lazy(() => import("./components/AMLLWrapper"));

function App() {
	const isLyricPageOpened = useAtomValue(isLyricPageOpenedAtom);
	const [lazyLoadLyricPage, setLazyLoadLyricPage] = useState(isLyricPageOpened);
	useLayoutEffect(() => {
		setLazyLoadLyricPage((v) => v || isLyricPageOpened);
	}, [isLyricPageOpened]);
	const showStatJSFrame = useAtomValue(showStatJSFrameAtom);
	const musicContextMode = useAtomValue(musicContextModeAtom);
	const displayLanguage = useAtomValue(displayLanguageAtom);
	const { i18n } = useTranslation();

	useEffect(() => {
		(async () => {
			await new Promise((r) => requestAnimationFrame(r));
			const win = getCurrentWindow();
			await win.show();
		})();
	}, []);

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
			{/* 上下文组件均不建议被 StrictMode 包含，以免重复加载扩展程序发生问题  */}
			{musicContextMode === MusicContextMode.Local && <LocalMusicContext />}
			{musicContextMode === MusicContextMode.WSProtocol && (
				<WSProtocolMusicContext />
			)}
			<UpdateContext />
			<Suspense>
				<ExtensionContext />
			</Suspense>
			<ExtensionInjectPoint injectPointName="context" hideErrorCallout />
			<StrictMode>
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
					<Suspense>
						<AMLLWrapper />
					</Suspense>
					<ToastContainer
						theme="dark"
						position="bottom-right"
						style={{
							marginBottom: "150px",
						}}
					/>
				</Theme>
			</StrictMode>
		</>
	);
}

export default App;

import { Suspense, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import { globalStore, AMLLEnvironment, amllEnvironmentAtom } from "@applemusic-like-lyrics/bncm/src/injector/index.tsx";
import { LyricPlayer } from "@applemusic-like-lyrics/bncm/src/player/index.tsx";
import "@applemusic-like-lyrics/bncm/src/index.sass";
import { Provider } from "jotai";
import { ErrorBoundary } from "react-error-boundary";

function ErrorRender({ error, resetErrorBoundary }) {
    console.error(error);
	return <div>
        <h2>An unrecoverable error has occured</h2>
        <code>
            <pre>
            {error.message}
            {error.stack}
            </pre>
        </code>
    </div>;
}

globalStore.set(amllEnvironmentAtom, AMLLEnvironment.AMLLPlayer);

function App() {
	return (
		<ErrorBoundary fallbackRender={ErrorRender}>
			<Provider store={globalStore}>
				<Suspense>
					<LyricPlayer />
				</Suspense>
			</Provider>
		</ErrorBoundary>
	);
}

export default App;

import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { App } from "./test-app";

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);

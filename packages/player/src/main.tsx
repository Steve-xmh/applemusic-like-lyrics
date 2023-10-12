import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import * as wsp from "@applemusic-like-lyrics/ws-protocol";

(window as any).wsp = wsp;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

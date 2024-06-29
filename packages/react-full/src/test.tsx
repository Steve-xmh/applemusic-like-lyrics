import { FC, useState } from "react";
import { createRoot } from "react-dom/client";
import { HorizontalLayout } from "./layout/horizontal";
import { VerticalLayout } from "./layout/vertical";

const App: FC = () => {
    const [hideLyric, setHideLyric] = useState(false);

    return <>
        <h1>AMLL React Framework gallery</h1>
        <h2>Horizontal Layout</h2>
        <label>
            <input type="checkbox" id="showLyric" checked={hideLyric} onChange={v => setHideLyric(!!v.target.checked)} />Hide lyric
        </label>

        <div>
            {hideLyric ? "Lyric is hidden" : "Lyric is shown"}
        </div>

        <div style={{
            width: "100%",
            height: "80vh",
            backgroundColor: "black",
        }}>
            <HorizontalLayout
                style={{
                    width: "100%", height: "100%"
                }}
                thumbSlot={
                    <div style={{ background: "red", width: "100%", height: "100%" }} >Thumb slot</div>
                }
                coverSlot={
                    <div style={{ background: "green", width: "100%", height: "100%" }} >Cover slot</div>
                }
                controlsSlot={
                    <div style={{ background: "orange", width: "100%", height: "100%" }} >Controls slot</div>
                }
                lyricSlot={
                    <div style={{ background: "pink", width: "100%", height: "100%" }} >Lyric slot</div>
                }
                hideLyric={hideLyric}
            />
        </div>
        <h2>Vertical Layout</h2>
        <label>
            <input type="checkbox" id="showLyric" checked={hideLyric} onChange={v => setHideLyric(!!v.target.checked)} />Hide lyric
        </label>
        <div style={{
            backgroundColor: "black",
            width: "40vw",
            maxWidth: "800px",
            maxHeight: "80vh",
            flex: "0",
        }}>
            <VerticalLayout
                style={{
                    width: "100%", height: "100%"
                }}
                // thumbSlot={
                //     <div style={{ background: "red", width: "100%", height: "100%" }} >Thumb slot</div>
                // }
                // coverSlot={
                //     <div style={{ background: "green", width: "100%", height: "100%" }} >Cover slot</div>
                // }
                // smallControlsSlot={
                //     <div style={{ background: "orange", width: "100%", height: "100%" }} >Small Controls slot</div>
                // }
                // lyricSlot={
                //     <div style={{ background: "pink", width: "100%", height: "100%" }} >Lyric slot</div>
                // }
                hideLyric={hideLyric}
            />
        </div>
    </>
}

createRoot(document.getElementById("root") as HTMLElement).render(<App />)

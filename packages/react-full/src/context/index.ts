/**
 * @fileoverview
 * 为了在整个歌词页面中传递播放状态信息和一些个性化设置选项，使用 Context 来传递
 */

import { createContext } from "react";
import { AMLLConfig, defaultAMLLConfig } from "./config";

export const AMLLMusicContext = createContext({
    
});

export const AMLLConfigContext = createContext<AMLLConfig>(defaultAMLLConfig);

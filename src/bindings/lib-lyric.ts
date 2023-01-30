import { atom } from "jotai";
import { LyricLine } from "../core/lyric-parser";

const _lyricData = atom<LyricLine[]>([]);

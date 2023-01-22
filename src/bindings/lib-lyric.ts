import { atom } from "jotai";
import { LyricLine } from "../core/lyric-parser";

const lyricData = atom<LyricLine[]>([])

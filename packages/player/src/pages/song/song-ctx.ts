import { createContext } from "react";
import type { Song } from "../../dexie.ts";

export const SongContext = createContext<Song | undefined>(undefined);

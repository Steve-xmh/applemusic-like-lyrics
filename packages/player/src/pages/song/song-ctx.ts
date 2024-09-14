import { createContext } from "react";
import type { Song } from "../../dexie";

export const SongContext = createContext<Song | undefined>(undefined);

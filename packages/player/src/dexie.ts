import Dexie from "dexie";
import type { EntityTable } from "dexie";

interface Playlist {
	id: number;
	name: string;
	createTime: number;
	updateTime: number;
	playTime: number;
	songIds: string[];
}

interface Song {
	id: string;
	filePath: string;
	songName: string;
	songArtists: string;
	cover: string;
	duration: number;
	lyric: string;
}

export const db = new Dexie("amll-player") as Dexie & {
	playlists: EntityTable<Playlist, "id">;
	songs: EntityTable<Song, "id">;
};

db.version(1).stores({
	playlists: "++id,name,createTime,updateTime,playTime",
	songs: "&id,filePath,songName,songArtists",
});

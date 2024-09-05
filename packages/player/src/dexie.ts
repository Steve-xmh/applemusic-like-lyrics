import Dexie from "dexie";
import type { EntityTable } from "dexie";

export interface Playlist {
	id: number;
	name: string;
	createTime: number;
	updateTime: number;
	playTime: number;
	songIds: string[];
}

export interface Song {
	id: string;
	filePath: string;
	songName: string;
	songArtists: string;
	cover: Blob;
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

db.version(2).upgrade((trans) => {
	trans
		.table("songs")
		.toCollection()
		.modify((song) => {
			const raw = Uint8Array.from(atob(song.cover), (c) => c.charCodeAt(0));
			song.cover = new Blob([raw], { type: "image" });
		});
});

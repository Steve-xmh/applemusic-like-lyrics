import type { TTMLLyric } from "@applemusic-like-lyrics/lyric";
import type { EntityTable } from "dexie";
import Dexie from "dexie";

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
	songAlbum: string;
	cover: Blob;
	duration: number;
	lyricFormat: string;
	lyric: string;
	translatedLrc?: string;
	romanLrc?: string;
}

export interface TTMLDBLyricEntry {
	name: string;
	content: TTMLLyric;
	raw: string;
}

export const db = new Dexie("amll-player") as Dexie & {
	playlists: EntityTable<Playlist, "id">;
	songs: EntityTable<Song, "id">;
	ttmlDB: EntityTable<TTMLDBLyricEntry, "name">;
};

db.version(1).stores({
	playlists: "++id,name,createTime,updateTime,playTime",
	songs: "&id,filePath,songName,songArtists",
	ttmlDB: "&name",
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

db.version(3).upgrade((trans) => {
	trans
		.table("songs")
		.toCollection()
		.modify((song) => {
			song.songAlbum = "";
			song.lyricFormat = "";
		});
});

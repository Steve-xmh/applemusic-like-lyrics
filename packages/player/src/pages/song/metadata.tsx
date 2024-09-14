import { Button, Callout, Flex, TextField } from "@radix-ui/themes";
import {
	type FC,
	useCallback,
	useContext,
	useLayoutEffect,
	useState,
} from "react";
import { db } from "../../dexie";
import { readLocalMusicMetadata } from "../../utils/player";
import { Option } from "./common";
import { SongContext } from "./song-ctx";

const MetaInput: FC<
	TextField.RootProps & {
		label: string;
	}
> = ({ label, ...props }) => (
	<Option label={label}>
		<TextField.Root {...props} />
	</Option>
);

export const MetadataTabContent: FC = () => {
	const song = useContext(SongContext);
	const [songName, setSongName] = useState("");
	const [songArtists, setSongArtists] = useState("");
	const [songAlbum, setSongAlbum] = useState("");

	useLayoutEffect(() => {
		if (song) {
			setSongName(song.songName);
			setSongArtists(song.songArtists);
			setSongAlbum(song.songAlbum);
		} else {
			setSongName("");
			setSongArtists("");
			setSongAlbum("");
		}
	}, [song]);

	const uploadCoverAsImage = useCallback(() => {
		if (song === undefined) return;
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*,video/*";
		input.onchange = async () => {
			const file = input.files?.[0];
			if (file === undefined) return;
			db.songs.update(song, (song) => {
				song.cover = file;
			});
		};
		input.click();
	}, [song]);

	const readMetadataFromFile = useCallback(async () => {
		if (song === undefined) return;
		const newInfo = await readLocalMusicMetadata(song.filePath);

		db.songs.update(song.id, (song) => {
			song.songName = newInfo.name;
			song.songAlbum = newInfo.album;
			song.songArtists = newInfo.artist;
			if (newInfo.lyric) {
				song.lyricFormat = "lrc";
				song.lyric = newInfo.lyric;
			}
			if (newInfo.cover) {
				const coverData = new Uint8Array(newInfo.cover);
				const coverBlob = new Blob([coverData], { type: "image" });

				song.cover = coverBlob;
			}
		});
	}, [song]);

	const saveData = useCallback(() => {
		if (song === undefined) return;
		db.songs.update(song, (song) => {
			song.songName = songName;
			song.songArtists = songArtists;
			song.songAlbum = songAlbum;
		});
	}, [song, songName, songArtists, songAlbum]);

	return (
		<>
			<Callout.Root my="2">
				<Callout.Text>本页面的设置不会写入到原始音乐文件中</Callout.Text>
			</Callout.Root>
			<Flex direction="column" gap="4">
				<MetaInput
					label="音乐名称"
					value={songName}
					onChange={(v) => setSongName(v.currentTarget.value)}
				/>
				<MetaInput
					label="音乐作者"
					value={songArtists}
					onChange={(v) => setSongArtists(v.currentTarget.value)}
				/>
				<MetaInput
					label="音乐专辑名"
					value={songAlbum}
					onChange={(v) => setSongAlbum(v.currentTarget.value)}
				/>
			</Flex>
			<Button
				mt="4"
				style={{
					display: "block",
				}}
				variant="soft"
				onClick={uploadCoverAsImage}
			>
				更换封面图为图片/视频
			</Button>
			<Button
				mt="4"
				style={{
					display: "block",
				}}
				variant="soft"
				onClick={readMetadataFromFile}
			>
				重新从文件中读取元数据
			</Button>
			<Button
				mt="4"
				style={{
					display: "block",
				}}
				onClick={saveData}
			>
				保存
			</Button>
		</>
	);
};

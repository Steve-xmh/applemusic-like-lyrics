import {
	Avatar,
	Box,
	Button,
	Card,
	Flex,
	Heading,
	IconButton,
	Text,
} from "@radix-ui/themes";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, type FC } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../dexie";
import { ArrowLeftIcon, PlayIcon, PlusIcon } from "@radix-ui/react-icons";
import { open } from "@tauri-apps/plugin-dialog";
import { path } from "@tauri-apps/api";
import { invoke } from "@tauri-apps/api/core";
import md5 from "md5";
import { readLocalMusicMetadata } from "../../utils/player";

function toDuration(duration: number) {
	const isRemainTime = duration < 0;

	const d = Math.abs(duration | 0);
	const sec = d % 60;
	const min = Math.floor((d - sec) / 60);
	const secText = "0".repeat(2 - sec.toString().length) + sec;

	return `${isRemainTime ? "-" : ""}${min}:${secText}`;
}

export const PlaylistPage: FC = () => {
	const param = useParams();
	const playlist = useLiveQuery(() => db.playlists.get(Number(param.id)));
	const songs = useLiveQuery(
		() => db.songs.bulkGet(playlist?.songIds || []),
		[playlist?.songIds],
	);

	const onAddLocalMusics = useCallback(async () => {
		const results = await open({
			multiple: true,
			title: "选择本地音乐",
			filters: [
				{
					name: "音频文件",
					extensions: ["mp3", "flac", "wav", "m4a", "aac", "ogg"],
				},
			],
		});
		if (!results) return;
		const transformed = await Promise.all(
			results.map(async (v) => {
				const normalized = (await path.normalize(v.path)).replace(/\\/gi, "/");
				const pathMd5 = md5(normalized);
				const musicInfo = await readLocalMusicMetadata(normalized);

				return {
					id: pathMd5,
					filePath: normalized,
					songName: musicInfo.name,
					songArtists: musicInfo.artist,
					lyric: musicInfo.lyric,
					cover: musicInfo.cover,
					duration: musicInfo.duration,
				};
			}),
		);
		console.log(transformed);
		await db.songs.bulkPut(transformed);
		const shouldAddIds = transformed
			.map((v) => v.id)
			.filter((v) => !playlist?.songIds.includes(v));
		await db.playlists.update(Number(param.id), (obj) => {
			obj.songIds.push(...shouldAddIds);
		});
	}, [playlist, param.id]);

	const onPlayAll = useCallback(async () => {
		if (songs === undefined) return;
		await invoke("local_player_send_msg", {
			msg: {
				callbackId: "",
				data: {
					type: "setPlaylist",
					songs: songs
						.filter((v) => !!v)
						.map((v, i) => ({
							type: "local",
							filePath: v.filePath,
							origOrder: i,
						})),
				},
			},
		});
		await invoke("local_player_send_msg", {
			msg: {
				callbackId: "",
				data: {
					type: "jumpToSong",
					songIndex: 0,
				},
			},
		});
	}, [songs]);

	return (
		<>
			<Flex align="end" mt="4" mx="8" gap="4">
				<Button variant="soft" onClick={() => history.back()}>
					<ArrowLeftIcon />
					返回
				</Button>
			</Flex>
			<Flex align="end" mt="4" mx="8" gap="4">
				<Avatar size="9" fallback={<div />} />
				<Flex direction="column" gap="4">
					<Heading>{playlist?.name}</Heading>
					<Text>{playlist?.songIds?.length || 0} 首歌曲</Text>
					<Flex gap="2">
						<Button onClick={onPlayAll}>
							<PlayIcon />
							播放全部
						</Button>
						<Button variant="soft">随机播放</Button>
						<Button variant="soft" onClick={onAddLocalMusics}>
							<PlusIcon />
							添加本地歌曲
						</Button>
					</Flex>
				</Flex>
			</Flex>
			<Flex direction="column" mt="4" mx="8" gap="4" overflowY="auto">
				{songs ? (
					songs
						.filter((v) => !!v)
						.map((song) => (
							<Card key={song.id}>
								<Flex p="1" align="center" gap="4">
									<Avatar
										size="5"
										fallback={<div />}
										src={`data:image;base64,${song.cover}`}
									/>
									<Flex direction="column" justify="center" flexGrow="1">
										<Box>{song.songName || song.filePath}</Box>
										<Box>{song.songArtists}</Box>
									</Flex>
									<Box>{toDuration(song.duration)}</Box>
									<IconButton variant="ghost">
										<PlayIcon />
									</IconButton>
								</Flex>
							</Card>
						))
				) : (
					<></>
				)}
			</Flex>
		</>
	);
};

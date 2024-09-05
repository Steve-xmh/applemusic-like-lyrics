import {
	Avatar,
	Box,
	Button,
	Card,
	Flex,
	Heading,
	IconButton,
	Skeleton,
	Text,
} from "@radix-ui/themes";
import { useLiveQuery } from "dexie-react-hooks";
import { useCallback, useEffect, useMemo, type FC } from "react";
import { useParams } from "react-router-dom";
import { db, type Song } from "../../dexie";
import { ArrowLeftIcon, PlayIcon, PlusIcon } from "@radix-ui/react-icons";
import { open } from "@tauri-apps/plugin-dialog";
import { path } from "@tauri-apps/api";
import { VirtualList } from "react-base-virtual-list";
import md5 from "md5";
import {
	emitAudioThread,
	emitAudioThreadRet,
	readLocalMusicMetadata,
} from "../../utils/player";
import styles from "./index.module.css";

export type Loadable<Value> =
	| {
			state: "loading";
	  }
	| {
			state: "hasError";
			error: unknown;
	  }
	| {
			state: "hasData";
			data: Awaited<Value>;
	  };

function toDuration(duration: number) {
	const isRemainTime = duration < 0;

	const d = Math.abs(duration | 0);
	const sec = d % 60;
	const min = Math.floor((d - sec) / 60);
	const secText = "0".repeat(2 - sec.toString().length) + sec;

	return `${isRemainTime ? "-" : ""}${min}:${secText}`;
}

export const SongCard: FC<{
	songId: string;
	songIndex: number;
	isLast: boolean;
	onPlayList: (songIndex: number) => void;
}> = ({ songId, songIndex, isLast, onPlayList }) => {
	const song: Loadable<Song> = useLiveQuery(
		() =>
			db.songs.get(songId).then((data) => {
				if (!data) {
					return {
						state: "hasError",
						error: new Error(`未找到歌曲 ID ${songId}`),
					};
				}
				return {
					state: "hasData",
					data: data,
				};
			}),
		[songId],
		{
			state: "loading",
		},
	);
	const songImgUrl = useMemo(
		() =>
			song.state === "hasData" && song.data?.cover
				? URL.createObjectURL(song.data.cover)
				: "",
		[song],
	);
	useEffect(() => {
		return () => {
			if (songImgUrl.length > 0) URL.revokeObjectURL(songImgUrl);
		};
	}, [songImgUrl]);

	return (
		<Skeleton loading={song.state === "loading"}>
			<Card
				key={songId}
				style={{
					marginBottom: isLast ? "150px" : "",
				}}
				mt="2"
			>
				<Flex p="1" align="center" gap="4">
					<Avatar size="5" fallback={<div />} src={songImgUrl} />
					<Flex direction="column" justify="center" flexGrow="1">
						<Box>
							{song.state === "hasData" &&
								(song.data.songName ||
									song.data.filePath ||
									`未知歌曲 ID ${songId}`)}
						</Box>
						<Box>
							{song.state === "hasData" && (song.data.songArtists || "")}
						</Box>
					</Flex>
					<Box>
						{song.state === "hasData" &&
							(song.data.duration ? toDuration(song.data.duration) : "")}
					</Box>
					<IconButton
						variant="ghost"
						onClick={() => {
							onPlayList(songIndex);
						}}
					>
						<PlayIcon />
					</IconButton>
				</Flex>
			</Card>
		</Skeleton>
	);
};

export const PlaylistPage: FC = () => {
	const param = useParams();
	const playlist = useLiveQuery(() => db.playlists.get(Number(param.id)));

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
		const transformed = (
			await Promise.all(
				results.map(async (v) => {
					const normalized = (await path.normalize(v.path)).replace(
						/\\/gi,
						"/",
					);
					try {
						const pathMd5 = md5(normalized);
						const musicInfo = await readLocalMusicMetadata(normalized);

						const coverData = new Uint8Array(musicInfo.cover);
						const coverBlob = new Blob([coverData], { type: "image" });

						return {
							id: pathMd5,
							filePath: normalized,
							songName: musicInfo.name,
							songArtists: musicInfo.artist,
							lyric: musicInfo.lyric,
							cover: coverBlob,
							duration: musicInfo.duration,
						};
					} catch (err) {
						console.warn("解析歌曲元数据以添加歌曲失败", normalized, err);
						return null;
					}
				}),
			)
		).filter((v) => !!v);
		await db.songs.bulkPut(transformed);
		const shouldAddIds = transformed
			.map((v) => v.id)
			.filter((v) => !playlist?.songIds.includes(v))
			.reverse();
		await db.playlists.update(Number(param.id), (obj) => {
			obj.songIds.unshift(...shouldAddIds);
		});
	}, [playlist, param.id]);

	const onPlayList = useCallback(
		async (songIndex = 0) => {
			if (playlist === undefined) return;
			const collected = await db.songs
				.toCollection()
				.filter((v) => playlist.songIds.includes(v.id))
				.toArray();
			collected.sort((a, b) => {
				return playlist.songIds.indexOf(a.id) - playlist.songIds.indexOf(b.id);
			});
			await emitAudioThread("setPlaylist", {
				songs: collected.map((v, i) => ({
					type: "local",
					filePath: v.filePath,
					origOrder: i,
				})),
			});
			await emitAudioThread("jumpToSong", {
				songIndex,
			});
		},
		[playlist],
	);

	const onPlaylistDefault = useCallback(onPlayList.bind(null, 0), [onPlayList]);

	return playlist?.songIds ? (
		<VirtualList
			items={playlist.songIds}
			className={styles.playlist}
			renderHead={() => (
				<Flex
					gap="4"
					direction="column"
					position="sticky"
					top="0"
					style={{
						zIndex: "10",
						paddingBottom: "var(--space-4)",
						backgroundColor: "var(--color-background)",
					}}
				>
					<Flex align="end" pt="4">
						<Button variant="soft" onClick={() => history.back()}>
							<ArrowLeftIcon />
							返回
						</Button>
					</Flex>
					<Flex align="end" gap="4">
						<Avatar size="9" fallback={<div />} />
						<Flex
							direction="column"
							gap="4"
							display={{
								initial: "none",
								sm: "flex",
							}}
						>
							<Heading>{playlist?.name}</Heading>
							<Text>{playlist?.songIds?.length || 0} 首歌曲</Text>
							<Flex gap="2">
								<Button onClick={onPlaylistDefault}>
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
						<Flex
							direction="column"
							gap="4"
							display={{
								xs: "flex",
								sm: "none",
							}}
						>
							<Heading>{playlist?.name}</Heading>
							<Text>{playlist?.songIds?.length || 0} 首歌曲</Text>
							<Flex gap="2">
								<IconButton onClick={onPlaylistDefault}>
									<PlayIcon />
								</IconButton>
								<IconButton variant="soft" onClick={onAddLocalMusics}>
									<PlusIcon />
								</IconButton>
							</Flex>
						</Flex>
					</Flex>
				</Flex>
			)}
			renderItem={(songId, index) => (
				<SongCard
					songId={songId}
					songIndex={index}
					isLast={index === playlist.songIds.length - 1}
					onPlayList={onPlayList}
				/>
			)}
		/>
	) : (
		<></>
	);
};

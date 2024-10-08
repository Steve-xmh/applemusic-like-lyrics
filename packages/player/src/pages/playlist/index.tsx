import {
	ArrowLeftIcon,
	HamburgerMenuIcon,
	Pencil1Icon,
	PlayIcon,
	PlusIcon,
} from "@radix-ui/react-icons";
import {
	Avatar,
	Box,
	Button,
	Card,
	Container,
	DropdownMenu,
	Flex,
	Heading,
	IconButton,
	Skeleton,
	Text,
	TextField,
} from "@radix-ui/themes";
import { path } from "@tauri-apps/api";
import { open } from "@tauri-apps/plugin-dialog";
import { platform } from "@tauri-apps/plugin-os";
import { useLiveQuery } from "dexie-react-hooks";
import md5 from "md5";
import {
	type CSSProperties,
	type FC,
	type HTMLProps,
	forwardRef,
	useCallback,
	useMemo,
	useState,
} from "react";
import { Trans, useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import AutoSizer from "react-virtualized-auto-sizer";
import { SortableFixedSizeList } from "react-window-sortable";
import { PlaylistCover } from "../../components/PlaylistCover";
import { type Song, db } from "../../dexie";
import { router } from "../../router";
import { emitAudioThread, readLocalMusicMetadata } from "../../utils/player";
import { useSongCover } from "../../utils/use-song-cover";
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

export const SongCard = forwardRef<
	HTMLDivElement,
	{
		songId: string;
		songIndex: number;
		onPlayList: (songIndex: number) => void;
		onDeleteSong: (songId: string) => void;
		style?: CSSProperties;
	}
>(({ songId, songIndex, onPlayList, onDeleteSong, style }, ref) => {
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
	const songImgUrl = useSongCover(
		song.state === "hasData" ? song.data : undefined,
	);
	const { t } = useTranslation();
	const navigate = useNavigate();

	return (
		<Skeleton
			style={style}
			key={`song-card-${songId}`}
			loading={song.state === "loading"}
			ref={ref}
			onDoubleClick={() => onPlayList(songIndex)}
		>
			<Box py="4" pr="4" style={style}>
				<Card>
					<Flex p="1" align="center" gap="4">
						<Avatar size="5" fallback={<div />} src={songImgUrl} />
						<Flex direction="column" justify="center" flexGrow="1" minWidth="0">
							<Text wrap="nowrap" truncate>
								{song.state === "hasData" &&
									(song.data.songName ||
										song.data.filePath ||
										t(
											"page.playlist.music.unknownSongName",
											"未知歌曲 ID {id}",
											{
												id: songId,
											},
										))}
							</Text>
							<Text wrap="nowrap" truncate color="gray">
								{song.state === "hasData" && (song.data.songArtists || "")}
							</Text>
						</Flex>
						<Text wrap="nowrap">
							{song.state === "hasData" &&
								(song.data.duration ? toDuration(song.data.duration) : "")}
						</Text>
						<IconButton variant="ghost" onClick={() => onPlayList(songIndex)}>
							<PlayIcon />
						</IconButton>
						<DropdownMenu.Root>
							<DropdownMenu.Trigger>
								<IconButton
									variant="ghost"
									onClick={() => router.navigate(`/song/${songId}`)}
								>
									<HamburgerMenuIcon />
								</IconButton>
							</DropdownMenu.Trigger>
							<DropdownMenu.Content>
								<DropdownMenu.Item onClick={() => onPlayList(songIndex)}>
									<Trans i18nKey="page.playlist.music.dropdown.playMusic">
										播放音乐
									</Trans>
								</DropdownMenu.Item>
								<DropdownMenu.Item onClick={() => navigate(`/song/${songId}`)}>
									<Trans i18nKey="page.playlist.music.dropdown.editMusicOverrideData">
										编辑歌曲覆盖信息
									</Trans>
								</DropdownMenu.Item>
								<DropdownMenu.Separator />
								<DropdownMenu.Item
									color="red"
									onClick={() => onDeleteSong(songId)}
								>
									<Trans i18nKey="page.playlist.music.dropdown.removeFromPlaylist">
										从歌单中删除
									</Trans>
								</DropdownMenu.Item>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					</Flex>
				</Card>
			</Box>
		</Skeleton>
	);
});

const BOTTOM_PADDING = 150;

const PlaylistViewInner = forwardRef<HTMLDivElement, HTMLProps<HTMLDivElement>>(
	({ style, ...rest }, ref) => (
		<div
			ref={ref}
			style={{
				...style,
				height: `${(Number.parseFloat(style?.height?.toString() || "") || 0) + BOTTOM_PADDING}px`,
			}}
			{...rest}
		/>
	),
);

const EditablePlaylistName: FC<{
	playlistName: string;
	onPlaylistNameChange: (newName: string) => void;
}> = ({ playlistName, onPlaylistNameChange }) => {
	const [editing, setEditing] = useState(false);
	const [newName, setNewName] = useState(playlistName);

	return (
		<Heading className={styles.title}>
			{!editing && playlistName}
			{!editing && (
				<IconButton
					ml="2"
					style={{
						verticalAlign: "middle",
					}}
					size="1"
					variant="ghost"
					onClick={() => {
						setNewName(playlistName);
						setEditing(true);
					}}
				>
					<Pencil1Icon />
				</IconButton>
			)}
			{editing && (
				<TextField.Root
					value={newName}
					autoFocus
					onChange={(e) => setNewName(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							if (newName !== playlistName) onPlaylistNameChange(newName);
							setEditing(false);
						}
					}}
					onBlur={() => {
						if (newName !== playlistName) onPlaylistNameChange(newName);
						setEditing(false);
					}}
				/>
			)}
		</Heading>
	);
};

export const PlaylistPage: FC = () => {
	const param = useParams();
	const playlist = useLiveQuery(() => db.playlists.get(Number(param.id)));
	const { t } = useTranslation();

	const onAddLocalMusics = useCallback(async () => {
		const filters = [
			{
				name: t("page.playlist.addLocalMusic.filterName", "音频文件"),
				extensions: ["mp3", "flac", "wav", "m4a", "aac", "ogg"],
			},
			{
				name: t("page.playlist.addLocalMusic.allFiles", "所有文件"),
				extensions: ["*"],
			},
		];
		if (platform() === "android") {
			filters.length = 0;
		}
		if (platform() === "ios") {
			filters.length = 0;
		}
		const results = await open({
			multiple: true,
			title: "选择本地音乐",
			filters,
		});
		if (!results) return;
		console.log(results);
		const id = toast.loading(
			t(
				"page.playlist.addLocalMusic.toast.parsingMusicMetadata",
				"正在解析音乐元数据以添加歌曲 ({current, plural, other {#}} / {total, plural, other {#}})",
				{
					current: 0,
					total: results.length,
				},
			),
		);
		let current = 0;
		let success = 0;
		let errored = 0;
		const transformed = (
			await Promise.all(
				results.map(async (v) => {
					let normalized = v;
					if (platform() !== "android" && platform() !== "ios") {
						normalized = (await path.normalize(v)).replace(/\\/gi, "/");
					}
					try {
						const pathMd5 = md5(normalized);
						const musicInfo = await readLocalMusicMetadata(normalized);

						const coverData = new Uint8Array(musicInfo.cover);
						const coverBlob = new Blob([coverData], { type: "image" });

						success += 1;
						return {
							id: pathMd5,
							filePath: normalized,
							songName: musicInfo.name,
							songArtists: musicInfo.artist,
							songAlbum: musicInfo.album,
							lyricFormat: musicInfo.lyricFormat || "none",
							lyric: musicInfo.lyric,
							cover: coverBlob,
							duration: musicInfo.duration,
						} satisfies Song;
					} catch (err) {
						errored += 1;
						console.warn("解析歌曲元数据以添加歌曲失败", normalized, err);
						return null;
					} finally {
						current += 1;
						toast.update(id, {
							render: t(
								"page.playlist.addLocalMusic.toast.parsingMusicMetadata",
								"正在解析音乐元数据以添加歌曲 ({current, plural, other {#}} / {total, plural, other {#}})",
								{
									current: 0,
									total: results.length,
								},
							),
							progress: current / results.length,
						});
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
		toast.done(id);
		if (errored > 0 && success > 0) {
			toast.warn(
				t(
					"page.playlist.addLocalMusic.toast.partiallyFailed",
					"已添加 {succeed, plural, other {#}} 首歌曲，其中 {errored, plural, other {#}} 首歌曲添加失败",
					{
						succeed: success,
						errored,
					},
				),
			);
		} else if (success === 0) {
			toast.error(
				t(
					"page.playlist.addLocalMusic.toast.allFailed",
					"{errored, plural, other {#}} 首歌曲添加失败",
					{
						errored,
					},
				),
			);
		} else {
			toast.success(
				t(
					"page.playlist.addLocalMusic.toast.success",
					"已全部添加 {count, plural, other {#}} 首歌曲",
					{
						count: success,
					},
				),
			);
		}
	}, [playlist, param.id, t]);

	const onPlayList = useCallback(
		async (songIndex = 0, shuffle = false) => {
			if (playlist === undefined) return;
			const collected = await db.songs
				.toCollection()
				.filter((v) => playlist.songIds.includes(v.id))
				.toArray();
			if (shuffle) {
				for (let i = 0; i < collected.length; i++) {
					const j = Math.floor(Math.random() * (i + 1));
					[collected[i], collected[j]] = [collected[j], collected[i]];
				}
			} else {
				collected.sort((a, b) => {
					return (
						playlist.songIds.indexOf(a.id) - playlist.songIds.indexOf(b.id)
					);
				});
			}
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

	const onDeleteSong = useCallback(
		async (songId: string) => {
			if (playlist === undefined) return;
			await db.playlists.update(Number(param.id), (obj) => {
				obj.songIds = obj.songIds.filter((v) => v !== songId);
			});
		},
		[playlist, param.id],
	);

	const onPlaylistDefault = useCallback(onPlayList.bind(null, 0), [onPlayList]);
	const onPlaylistShuffle = useMemo(
		() => onPlayList.bind(null, 0, true),
		[onPlayList],
	);

	return (
		<Container
			mx={{
				initial: "4",
				sm: "9",
			}}
		>
			<Flex direction="column" maxHeight="100vh" height="100vh">
				<Flex gap="4" direction="column" flexGrow="0" pb="4" mt="5">
					<Flex align="end" pt="4">
						<Button variant="soft" onClick={() => history.back()}>
							<ArrowLeftIcon />
							<Trans i18nKey="common.page.back">返回</Trans>
						</Button>
					</Flex>
					<Flex align="end" gap="4">
						<PlaylistCover
							playlistId={Number(param.id)}
							style={{
								width: "12em",
							}}
						/>
						<Flex
							direction="column"
							gap="4"
							display={{
								initial: "none",
								sm: "flex",
							}}
						>
							<EditablePlaylistName
								playlistName={playlist?.name || ""}
								onPlaylistNameChange={(newName) =>
									db.playlists.update(Number(param.id), (obj) => {
										obj.name = newName;
									})
								}
							/>
							<Text>
								{t(
									"page.playlist.totalMusicLabel",
									"{count, plural, other {#}} 首歌曲",
									{
										count: playlist?.songIds?.length || 0,
									},
								)}
							</Text>
							<Flex gap="2">
								<Button onClick={onPlaylistDefault}>
									<PlayIcon />
									<Trans i18nKey="page.playlist.playAll">播放全部</Trans>
								</Button>
								<Button variant="soft" onClick={onPlaylistShuffle}>
									<Trans i18nKey="page.playlist.shufflePlayAll">随机播放</Trans>
								</Button>
								<Button variant="soft" onClick={onAddLocalMusics}>
									<PlusIcon />
									<Trans i18nKey="page.playlist.addLocalMusic.label">
										添加本地歌曲
									</Trans>
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
							<EditablePlaylistName
								playlistName={playlist?.name || ""}
								onPlaylistNameChange={(newName) =>
									db.playlists.update(Number(param.id), (obj) => {
										obj.name = newName;
									})
								}
							/>
							<Text>
								{t(
									"page.playlist.totalMusicLabel",
									"{count, plural, other {#}} 首歌曲",
									{
										count: playlist?.songIds?.length || 0,
									},
								)}
							</Text>
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
				<Box flexGrow="1" overflow="hidden" minHeight="0">
					{playlist?.songIds && (
						<AutoSizer>
							{({ width, height }) => (
								<SortableFixedSizeList
									itemCount={playlist.songIds.length}
									itemSize={96 + 16}
									innerElementType={PlaylistViewInner}
									width={width}
									height={height}
									onSortOrderChanged={({ originalIndex, newIndex }) => {
										// TODO
									}}
								>
									{forwardRef(({ index, style }, ref) => (
										<SongCard
											songId={playlist.songIds[index]}
											songIndex={index}
											style={style}
											onPlayList={onPlayList}
											onDeleteSong={onDeleteSong}
											ref={ref}
										/>
									))}
								</SortableFixedSizeList>
							)}
						</AutoSizer>
					)}
				</Box>
			</Flex>
		</Container>
	);
};

import { toDuration } from "@applemusic-like-lyrics/react-full";
import { ArrowLeftIcon, CopyIcon } from "@radix-ui/react-icons";
import {
	Avatar,
	Box,
	Button,
	Code,
	Container,
	DataList,
	Flex,
	IconButton,
	Select,
	Tabs,
	Text,
	TextArea,
	TextField,
} from "@radix-ui/themes";
import { useLiveQuery } from "dexie-react-hooks";
import {
	type FC,
	type PropsWithChildren,
	useCallback,
	useEffect,
	useState,
} from "react";
import { useParams } from "react-router-dom";
import { db } from "../../dexie";
import { readLocalMusicMetadata } from "../../utils/player";
import { useSongCover } from "../../utils/use-song-cover";

const Option: FC<
	PropsWithChildren<{
		label: string;
	}>
> = ({ label, children }) => (
	<Text as="label">
		<Flex gap="2" direction="column">
			{label}
			{children}
		</Flex>
	</Text>
);

const MetaInput: FC<
	TextField.RootProps & {
		label: string;
	}
> = ({ label, ...props }) => (
	<Option label={label}>
		<TextField.Root {...props} />
	</Option>
);

export const SongPage: FC = () => {
	const { id: musicId } = useParams<{ id: string }>();
	const song = useLiveQuery(() => db.songs.get(musicId || ""), [musicId]);
	const songImgUrl = useSongCover(song);

	const [songName, setSongName] = useState("");
	const [songArtists, setSongArtists] = useState("");
	const [songAlbum, setSongAlbum] = useState("");
	const [lyricFormat, setLyricFormat] = useState("none");
	const [lyricContent, setLyricContent] = useState("");

	useEffect(() => {
		if (song) {
			setSongName(song.songName);
			setSongArtists(song.songArtists);
			setSongAlbum(song.songAlbum);
			setLyricFormat(song.lyricFormat || "none");
			setLyricContent(song.lyric);
		} else {
			setSongName("");
			setSongArtists("");
			setSongAlbum("");
			setLyricFormat("none");
			setLyricContent("");
		}
	}, [song]);

	const saveData = useCallback(() => {
		if (song === undefined) return;
		db.songs.update(song, (song) => {
			song.songName = songName;
			song.songArtists = songArtists;
			song.songAlbum = songAlbum;
			song.lyricFormat = lyricFormat;
			song.lyric = lyricContent;
		});
	}, [song, songName, songArtists, songAlbum, lyricFormat, lyricContent]);

	const uploadCover = useCallback(() => {
		if (song === undefined) return;
		const input = document.createElement("input");
		input.type = "file";
		input.accept = "image/*";
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

	return (
		<Container
			mx={{
				initial: "4",
				sm: "9",
			}}
		>
			<Flex align="end" mt="4" gap="4">
				<Button variant="soft" onClick={() => history.back()}>
					<ArrowLeftIcon />
					返回
				</Button>
			</Flex>
			<Flex align="center" my="4" gap="4">
				<Avatar size="9" fallback={<div />} src={songImgUrl} />
				<Flex direction="column">
					<Text weight="bold" size="6">
						{song?.songName}
					</Text>
					<Text color="gray" size="5">
						{song?.songArtists}
					</Text>
				</Flex>
			</Flex>
			<Tabs.Root defaultValue="basic">
				<Tabs.List>
					<Tabs.Trigger value="basic">基本</Tabs.Trigger>
					<Tabs.Trigger value="metadata">元数据</Tabs.Trigger>
					<Tabs.Trigger value="lyric">歌词</Tabs.Trigger>
				</Tabs.List>
				<Box pt="3">
					<Tabs.Content value="basic">
						<DataList.Root>
							<DataList.Item>
								<DataList.Label>音乐 ID</DataList.Label>
								<DataList.Value>{song?.id || musicId}</DataList.Value>
							</DataList.Item>
							<DataList.Item>
								<DataList.Label>音乐文件路径</DataList.Label>
								<DataList.Value>
									<Flex align="center" gap="2">
										<Code variant="ghost">{song?.filePath}</Code>
										<IconButton
											size="1"
											aria-label="Copy value"
											color="gray"
											variant="ghost"
										>
											<CopyIcon />
										</IconButton>
									</Flex>
								</DataList.Value>
							</DataList.Item>
							<DataList.Item>
								<DataList.Label>音乐时长</DataList.Label>
								<DataList.Value>
									{toDuration(song?.duration || 0)}
								</DataList.Value>
							</DataList.Item>
						</DataList.Root>
					</Tabs.Content>
					<Tabs.Content value="metadata">
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
							onClick={uploadCover}
						>
							更换封面图
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
					</Tabs.Content>
					<Tabs.Content value="lyric">
						<Flex direction="column" gap="4">
							<Option label="歌词格式">
								<Select.Root
									defaultValue="none"
									onValueChange={(v) => setLyricFormat(v)}
								>
									<Select.Trigger />
									<Select.Content>
										<Select.Item value="none">无歌词</Select.Item>
										<Select.Item value="lrc">LyRiC 歌词</Select.Item>
										<Select.Item value="eslrc">ESLyRiC 歌词</Select.Item>
										<Select.Item value="yrc">YRC 歌词</Select.Item>
										<Select.Item value="qrc">QRC 歌词</Select.Item>
										<Select.Item value="lys">
											Lyricify Syllable 歌词
										</Select.Item>
										<Select.Item value="ttml">TTML 歌词</Select.Item>
									</Select.Content>
								</Select.Root>
							</Option>
							{lyricFormat !== "none" && lyricFormat.length > 0 && (
								<Option label="歌词数据">
									<TextArea
										value={lyricContent}
										style={{
											minHeight: "10rem",
										}}
										onChange={(v) => setLyricContent(v.currentTarget.value)}
									/>
								</Option>
							)}
						</Flex>
						<Button mt="4" onClick={saveData}>
							保存
						</Button>
					</Tabs.Content>
				</Box>
			</Tabs.Root>
		</Container>
	);
};

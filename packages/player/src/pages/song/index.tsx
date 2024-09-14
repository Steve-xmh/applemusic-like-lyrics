import { ArrowLeftIcon } from "@radix-ui/react-icons";
import {
	Avatar,
	Box,
	Button,
	Container,
	Flex,
	Tabs,
	Text,
} from "@radix-ui/themes";
import { useLiveQuery } from "dexie-react-hooks";
import { type FC, useContext } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../dexie";
import { useSongCover } from "../../utils/use-song-cover";
import { BasicTabContent } from "./basic";
import { LyricTabContent } from "./lyric";
import { MetadataTabContent } from "./metadata";
import { SongContext } from "./song-ctx";

const SongPageHeader: FC = () => {
	const song = useContext(SongContext);
	const songImgUrl = useSongCover(song);

	return (
		<>
			<Flex align="end" mt="7" gap="4">
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
		</>
	);
};

export const SongPage: FC = () => {
	const { id: musicId } = useParams<{ id: string }>();
	const song = useLiveQuery(() => db.songs.get(musicId || ""), [musicId]);

	return (
		<Container
			mx={{
				initial: "4",
				sm: "9",
			}}
			mb="150px"
		>
			<SongContext.Provider value={song}>
				<SongPageHeader />
				<Tabs.Root defaultValue="basic">
					<Tabs.List>
						<Tabs.Trigger value="basic">基本</Tabs.Trigger>
						<Tabs.Trigger value="metadata">元数据</Tabs.Trigger>
						<Tabs.Trigger value="lyric">歌词</Tabs.Trigger>
					</Tabs.List>
					<Box pt="3">
						<Tabs.Content value="basic">
							<BasicTabContent />
						</Tabs.Content>
						<Tabs.Content value="metadata">
							<MetadataTabContent />
						</Tabs.Content>
						<Tabs.Content value="lyric">
							<LyricTabContent />
						</Tabs.Content>
					</Box>
				</Tabs.Root>
			</SongContext.Provider>
		</Container>
	);
};

import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import {
	Box,
	Card,
	Flex,
	Heading,
	Spinner,
	TextField,
	Text,
} from "@radix-ui/themes";
import type { FC } from "react";
import { NewPlaylistButton } from "../../components/NewPlaylistButton";
import { SettingsButton } from "../../components/SettingsButton";
import { db } from "../../dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { Link } from "react-router-dom";

export const MainPage: FC = () => {
	const playlists = useLiveQuery(() => db.playlists.toArray());

	return (
		<>
			<Flex direction="row" align="center" wrap="wrap">
				<Box asChild flexGrow="1">
					<Heading wrap="nowrap" my="4">
						AMLL Player
					</Heading>
				</Box>
				<Flex gap="1" wrap="wrap">
					<TextField.Root placeholder="搜索……">
						<TextField.Slot>
							<MagnifyingGlassIcon />
						</TextField.Slot>
					</TextField.Root>
					<NewPlaylistButton />
					<SettingsButton />
				</Flex>
			</Flex>
			{playlists !== undefined ? (
				playlists.length === 0 ? (
					<Text mt="9" as="div" align="center">
						没有播放列表，快去新建一个吧！
					</Text>
				) : (
					<>
						{playlists.map((v) => (
							<Card asChild size="2" key={v.id}>
								<Link to={`/playlist/${v.id}`}>{v.name}</Link>
							</Card>
						))}
					</>
				)
			) : (
				<Flex
					direction="column"
					gap="2"
					justify="center"
					align="center"
					height="70vh"
				>
					<Spinner size="3" />
					加载歌单中
				</Flex>
			)}
		</>
	);
};

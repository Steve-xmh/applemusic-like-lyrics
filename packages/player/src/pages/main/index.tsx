import { GearIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import {
	Box,
	Button,
	Card,
	Container,
	Flex,
	Heading,
	Spinner,
	Text,
	TextField,
} from "@radix-ui/themes";
import { useLiveQuery } from "dexie-react-hooks";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { NewPlaylistButton } from "../../components/NewPlaylistButton";
import { db } from "../../dexie";

export const MainPage: FC = () => {
	const playlists = useLiveQuery(() => db.playlists.toArray());

	return (
		<Container
			mx={{
				initial: "4",
				sm: "9",
			}}
		>
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
					<Button variant="soft" asChild>
						<Link to="/settings">
							<GearIcon />
							设置
						</Link>
					</Button>
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
							<Card asChild size="2" mb="4" key={v.id}>
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
		</Container>
	);
};

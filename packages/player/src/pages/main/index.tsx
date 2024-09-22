import { HamburgerMenuIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import {
	Badge,
	Box,
	Card,
	Container,
	ContextMenu,
	DropdownMenu,
	Flex,
	Heading,
	IconButton,
	Spinner,
	Text,
	TextField,
} from "@radix-ui/themes";
import { useLiveQuery } from "dexie-react-hooks";
import { useAtomValue } from "jotai";
import type { FC } from "react";
import { Link } from "react-router-dom";
import { NewPlaylistButton } from "../../components/NewPlaylistButton";
import { db } from "../../dexie";
import { router } from "../../router";
import { updateInfoAtom } from "../../states/updater";

export const MainPage: FC = () => {
	const playlists = useLiveQuery(() => db.playlists.toArray());
	const updateInfo = useAtomValue(updateInfoAtom);

	return (
		<Container
			mx={{
				initial: "4",
				sm: "9",
			}}
		>
			<Flex direction="row" align="center" wrap="wrap" mt="5">
				<Box asChild flexGrow="1">
					<Heading wrap="nowrap" my="4">
						AMLL Player
						{updateInfo && (
							<Badge
								onClick={() => router.navigate("/settings#updater")}
								radius="full"
								style={{
									cursor: "pointer",
								}}
								color="indigo"
								ml="2"
							>
								有可用更新
							</Badge>
						)}
					</Heading>
				</Box>
				<Flex gap="1" wrap="wrap">
					<Box
						display={{
							initial: "none",
							sm: "block",
						}}
					>
						<TextField.Root placeholder="搜索……">
							<TextField.Slot>
								<MagnifyingGlassIcon />
							</TextField.Slot>
						</TextField.Root>
					</Box>
					<NewPlaylistButton />
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<IconButton variant="soft">
								<HamburgerMenuIcon />
							</IconButton>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content>
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger>
									进入 WS Protocol 模式
								</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent>
									<DropdownMenu.Item asChild>
										<Link to="/ws/recv">作为状态接收者</Link>
									</DropdownMenu.Item>
									<DropdownMenu.Item disabled>
										{/* <Link to="/ws/send">作为状态发送者（施工中）</Link> */}
										作为状态发送者（施工中）
									</DropdownMenu.Item>
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
							<DropdownMenu.Item asChild>
								<Link to="/settings">设置</Link>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
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
							<ContextMenu.Root key={v.id}>
								<ContextMenu.Trigger>
									<Card asChild size="2" mb="4" key={v.id}>
										<Link to={`/playlist/${v.id}`}>{v.name}</Link>
									</Card>
								</ContextMenu.Trigger>
								<ContextMenu.Content>
									<ContextMenu.Item
										color="red"
										onSelect={() => db.playlists.delete(v.id)}
									>
										删除
									</ContextMenu.Item>
								</ContextMenu.Content>
							</ContextMenu.Root>
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

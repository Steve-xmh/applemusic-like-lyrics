import { HamburgerMenuIcon } from "@radix-ui/react-icons";
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
} from "@radix-ui/themes";
import { useLiveQuery } from "dexie-react-hooks";
import { useAtomValue } from "jotai";
import type { FC } from "react";
import { Trans } from "react-i18next";
import { Link } from "react-router-dom";
import { NewPlaylistButton } from "../../components/NewPlaylistButton";
import { PlaylistCover } from "../../components/PlaylistCover";
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
								<Trans i18nKey="page.main.updateAvailableTag">有可用更新</Trans>
							</Badge>
						)}
					</Heading>
				</Box>
				<Flex gap="1" wrap="wrap">
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
									<Trans i18nKey="page.main.menu.enterWSProtocolMode">
										进入 WS Protocol 模式
									</Trans>
								</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent>
									<DropdownMenu.Item asChild>
										<Link to="/ws/recv">
											<Trans i18nKey="page.main.menu.asWSProtocolReceiver">
												作为状态接收者
											</Trans>
										</Link>
									</DropdownMenu.Item>
									<DropdownMenu.Item disabled>
										<Trans i18nKey="page.main.menu.asWSProtocolSenderWIP">
											作为状态发送者（施工中）
										</Trans>
									</DropdownMenu.Item>
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
							<DropdownMenu.Item asChild>
								<Link to="/settings">
									<Trans i18nKey="page.main.menu.settings">设置</Trans>
								</Link>
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Flex>
			</Flex>
			{playlists !== undefined ? (
				playlists.length === 0 ? (
					<Text mt="9" as="div" align="center">
						<Trans i18nKey="page.main.noPlaylistTip">
							没有播放列表，快去新建一个吧！
						</Trans>
					</Text>
				) : (
					<>
						{playlists.map((v) => (
							<ContextMenu.Root key={v.id}>
								<ContextMenu.Trigger>
									<Card asChild size="2" mb="4" key={v.id}>
										<Link to={`/playlist/${v.id}`}>
											<Flex align="center" gap="2">
												<PlaylistCover playlistId={v.id} />
												{v.name}
											</Flex>
										</Link>
									</Card>
								</ContextMenu.Trigger>
								<ContextMenu.Content>
									<ContextMenu.Item
										color="red"
										onSelect={() => db.playlists.delete(v.id)}
									>
										<Trans i18nKey="page.main.playlistMenu.delete">删除</Trans>
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
					<Trans i18nKey="page.main.loadingPlaylist">加载歌单中</Trans>
				</Flex>
			)}
		</Container>
	);
};

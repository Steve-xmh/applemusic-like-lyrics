import { ArrowLeftIcon, InfoCircledIcon } from "@radix-ui/react-icons";
import {
	Box,
	Button,
	Callout,
	Card,
	Container,
	Flex,
	Text,
	TextField,
} from "@radix-ui/themes";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { type FC, useEffect, useMemo } from "react";
import {
	MusicContextMode,
	musicContextModeAtom,
	wsProtocolConnectedAddrsAtom,
	wsProtocolListenAddrAtom,
} from "../../states";

export const WSProtocolRecvPage: FC = () => {
	const [wsProtocolListenAddr, setWsProtocolListenAddr] = useAtom(
		wsProtocolListenAddrAtom,
	);
	const connectedAddrs = useAtomValue(wsProtocolConnectedAddrsAtom);
	const setMusicContextMode = useSetAtom(musicContextModeAtom);
	const connectedAddrsArray = useMemo(
		() => [...connectedAddrs],
		[connectedAddrs],
	);

	useEffect(() => {
		setMusicContextMode(MusicContextMode.WSProtocol);
		return () => {
			setMusicContextMode(MusicContextMode.Local);
		};
	}, [setMusicContextMode]);

	return (
		<Container
			mx={{
				initial: "4",
				sm: "9",
			}}
			pt="env(safe-area-inset-top)"
			mb="150px"
		>
			<Flex align="end" mt="7" gap="4">
				<Button variant="soft" onClick={() => history.back()}>
					<ArrowLeftIcon />
					返回
				</Button>
			</Flex>
			<Card mt="2">
				<Flex align="center">
					<Box flexGrow="1">
						<Text>开放网络地址</Text>
					</Box>
					<TextField.Root
						type="url"
						placeholder="localhost:11444"
						value={wsProtocolListenAddr}
						onChange={(e) => setWsProtocolListenAddr(e.target.value)}
					/>
				</Flex>
			</Card>
			<Callout.Root mt="2">
				<Callout.Icon>
					<InfoCircledIcon />
				</Callout.Icon>
				<Callout.Text>
					连接到客户端后，可能需要切换一次歌曲方可同步歌曲信息状态
				</Callout.Text>
			</Callout.Root>
			<Card mt="2">
				<Text weight="bold">已连接的客户端</Text>
				{connectedAddrsArray.map((addr) => (
					<Box key={`connected-addr-${addr}`}>
						<Text color="gray">{addr}</Text>
					</Box>
				))}
				{connectedAddrsArray.length === 0 && (
					<Box>
						<Text color="gray">无</Text>
					</Box>
				)}
			</Card>
		</Container>
	);
};

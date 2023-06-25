import {
	Card,
	Flex,
	LoadingOverlay,
	Modal,
	Image,
	Box,
	Text,
	NumberInput,
	Space,
	Button,
} from "@mantine/core";
import { useAtom, useAtomValue } from "jotai";
import * as React from "react";
import {
	getLyric,
	getLyricCachePath,
	getNCMImageUrl,
	getPlayingSong,
	getSongDetail,
	SongDetailResponse,
} from "../../api";
import { useReloadLyricByCurrentAudioId } from "../../api/react";
import { musicIdAtom, selectMusicIdModalOpenedAtom } from "../../core/states";
import { warn } from "../../utils/logger";
import { isNCMV3 } from "../../utils";

const SongView: React.FC<{ id?: number }> = (props) => {
	const [songRes, setSongRes] = React.useState<SongDetailResponse>();
	const songInfo = React.useMemo(
		() => (songRes === undefined ? undefined : songRes?.songs[0] || null),
		[songRes],
	);
	React.useEffect(() => {
		setSongRes(undefined);
		let canceled = false;
		(async () => {
			if (props.id) {
				const info = await getSongDetail(props.id);
				if (!canceled) {
					setSongRes(info);
				}
			}
		})();
		return () => {
			canceled = true;
		};
	}, [props.id]);

	return (
		<Card>
			<Flex
				justify="flex-start"
				align={songInfo ? "flex-start" : "center"}
				direction="row"
				wrap="nowrap"
				gap="md"
			>
				<Image
					src={
						songInfo
							? songInfo.al.picUrl
							: `orpheus://cache/?${getNCMImageUrl("16601526067802346")}`
					}
					radius="md"
					height={64}
					width={64}
				/>
				<Box>
					<Text size="md">
						{props.id
							? songInfo === undefined
								? "正在加载"
								: songInfo === null
								? "无此歌曲"
								: songInfo.name
							: "未知音乐"}
					</Text>
					<Text lineClamp={1}>
						{props.id
							? songInfo
								? songInfo.ar.map((v) => v.name).join(" / ")
								: ""
							: "未知歌手"}
					</Text>
					<Text lineClamp={1}>
						{props.id ? (songInfo ? songInfo.al.name : "") : "未知专辑"}
					</Text>
				</Box>
			</Flex>
		</Card>
	);
};

export const SelectMusicIdModal: React.FC = () => {
	const [selectMusicIdModalOpened, setSelectMusicIdModalOpened] = useAtom(
		selectMusicIdModalOpenedAtom,
	);

	const musicId = useAtomValue(musicIdAtom);

	const [selectMusicIdModalLoading, setSelectMusicIdModalLoading] =
		React.useState(false);
	const [selectMusicId, setSelectMusicId] = React.useState(0);

	React.useLayoutEffect(() => {
		if (!selectMusicIdModalOpened) setSelectMusicId(+musicId);
	}, [musicId, selectMusicIdModalOpened]);

	const reloadLyricByCurrentAudioId = useReloadLyricByCurrentAudioId();

	return (
		<Modal
			zIndex={isNCMV3() ? 999 : undefined}
			title="输入音乐 ID 以加载对应的歌词"
			opened={selectMusicIdModalOpened}
			onClose={() => setSelectMusicIdModalOpened(false)}
			closeOnClickOutside={!selectMusicIdModalLoading}
			centered
		>
			<LoadingOverlay
				visible={selectMusicIdModalLoading}
				radius="sm"
				size={50}
				loaderProps={{
					style: {
						width: "50px",
						height: "50px",
					},
				}}
			/>
			<SongView id={selectMusicId} />
			<NumberInput
				label="音乐 ID"
				hideControls
				data-autofocus
				value={selectMusicId}
				onChange={setSelectMusicId}
			/>
			<Space h="xl" />
			<Button
				onClick={async () => {
					if (selectMusicId) {
						setSelectMusicIdModalLoading(true);
						try {
							const data = {
								...(await getLyric(selectMusicId)),
								trackInfo: getPlayingSong().data,
							};
							const lyricsPath = getLyricCachePath();
							const cachedLyricPath = `${lyricsPath}/${musicId}.json`;
							if (!(await betterncm.fs.exists(lyricsPath))) {
								betterncm.fs.mkdir(lyricsPath);
							}
							if (await betterncm.fs.exists(cachedLyricPath)) {
								await betterncm.fs.remove(cachedLyricPath);
							}
							await betterncm.fs.writeFile(
								cachedLyricPath,
								JSON.stringify(data),
							);
							await reloadLyricByCurrentAudioId();
							setSelectMusicIdModalOpened(false);
						} catch (err) {
							warn("警告：歌词加载失败", err);
						}
						setSelectMusicIdModalLoading(false);
					}
				}}
			>
				使用该音乐
			</Button>
		</Modal>
	);
};

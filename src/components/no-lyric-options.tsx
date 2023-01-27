/**
 * @fileoverview
 * 在没有可用歌词的情况下显示的使用其他歌词来源的选项组件
 */
import * as React from "react";
import {
	Text,
	Button,
	LoadingOverlay,
	Space,
	Modal,
	NumberInput,
	FileInput,
	Card,
	Image,
	Flex,
	Box,
} from "@mantine/core";
import {
	getNCMImageUrl,
	getSongDetail,
	loadLyric,
	SongDetailResponse,
} from "../api";
import {
	PURE_MUSIC_LYRIC_LINE,
	PURE_MUSIC_LYRIC_DATA,
} from "../core/lyric-parser";
import { log, warn } from "../utils/logger";
import {
	currentLyricsAtom,
	currentRawLyricRespAtom,
	musicIdAtom,
} from "../core/states";
import { useAtomValue, useSetAtom } from "jotai";

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

export const NoLyricOptions: React.FC<{
	onSetError: (err: Error | null) => void;
}> = (props) => {
	const musicId = useAtomValue(musicIdAtom);
	const [selectMusicIdModalOpened, setSelectMusicIdModalOpened] =
		React.useState(false);

	const [selectMusicIdModalLoading, setSelectMusicIdModalLoading] =
		React.useState(false);

	const [selectLocalLyricModalOpened, setLocalLyricModalOpened] =
		React.useState(false);

	const [selectLocalLyricModalLoading, setLocalLyricModalLoading] =
		React.useState(false);
	const [selectMusicId, setSelectMusicId] = React.useState(0);
	const [originalLyricFile, setOriginalLyricFile] = React.useState<File | null>(
		null,
	);
	const [translatedLyricFile, setTranslatedLyricFile] =
		React.useState<File | null>(null);
	const [romanLyricFile, setRomanLyricFile] = React.useState<File | null>(null);
	const [dynamicLyricFile, setDynamicLyricFile] = React.useState<File | null>(
		null,
	);
	const setCurrentLyrics = useSetAtom(currentLyricsAtom);
	const setCurrentRawLyricResp = useSetAtom(currentRawLyricRespAtom);

	const reloadLyricByCurrentAudioId = React.useCallback(async () => {
		props.onSetError(null);
		setCurrentLyrics(null);
		try {
			const lyric = await loadLyric(musicId);
			log("已获取到歌词", lyric);
			setCurrentRawLyricResp(lyric);
		} catch (err) {
			props.onSetError(err);
		}
	}, [musicId]);

	return (
		<div className="am-lyric-view-no-lyric">
			<Text fz="md">没有可用歌词，但是你可以手动指定需要使用的歌词：</Text>
			<Space h="xl" />
			<Button.Group orientation="vertical">
				<Button
					variant="outline"
					onClick={() => setSelectMusicIdModalOpened(true)}
				>
					使用指定网易云已有音乐歌词
				</Button>
				<Button
					variant="outline"
					onClick={() => setLocalLyricModalOpened(true)}
				>
					使用本地歌词文件
				</Button>
				<Button
					variant="outline"
					onClick={async () => {
						const lyricsPath = `${plugin.pluginPath}/lyrics`;
						const cachedLyricPath = `${lyricsPath}/${musicId}.json`;
						setCurrentLyrics(PURE_MUSIC_LYRIC_LINE);
						try {
							if (!(await betterncm.fs.exists(lyricsPath))) {
								betterncm.fs.mkdir(lyricsPath);
							}
							await betterncm.fs.writeFile(
								cachedLyricPath,
								JSON.stringify(PURE_MUSIC_LYRIC_DATA, null, 4),
							);
						} catch {}
					}}
				>
					这是纯音乐
				</Button>
			</Button.Group>
			<Modal
				title="输入音乐 ID 以加载对应的歌词"
				opened={selectMusicIdModalOpened}
				onClose={() => setSelectMusicIdModalOpened(false)}
				closeOnClickOutside={!selectMusicIdModalLoading}
				centered
				zIndex={151}
			>
				<LoadingOverlay
					visible={selectMusicIdModalLoading}
					radius="sm"
					zIndex={153}
					size={50}
					loaderProps={{ style: { width: "50px", height: "50px" } }}
				/>
				<SongView id={selectMusicId} />
				<NumberInput
					label="音乐 ID"
					hideControls
					value={selectMusicId}
					onChange={setSelectMusicId}
				/>
				<Space h="xl" />
				<Button
					onClick={async () => {
						if (selectMusicId) {
							setSelectMusicIdModalLoading(true);
							try {
								const data = await loadLyric(selectMusicId);
								const lyricsPath = `${plugin.pluginPath}/lyrics`;
								const cachedLyricPath = `${lyricsPath}/${musicId}.json`;
								if (!(await betterncm.fs.exists(lyricsPath))) {
									betterncm.fs.mkdir(lyricsPath);
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
			<Modal
				title="导入歌词文件"
				opened={selectLocalLyricModalOpened}
				closeOnClickOutside={!selectLocalLyricModalLoading}
				onClose={() => setLocalLyricModalOpened(false)}
				centered
				zIndex={151}
			>
				<LoadingOverlay
					visible={selectLocalLyricModalLoading}
					radius="sm"
					zIndex={153}
					size={50}
					loaderProps={{ style: { width: "50px", height: "50px" } }}
				/>
				<FileInput
					label="原文歌词文件"
					value={originalLyricFile}
					onChange={setOriginalLyricFile}
				/>
				<Space h="md" />
				<FileInput
					label="翻译歌词文件"
					value={translatedLyricFile}
					onChange={setTranslatedLyricFile}
				/>
				<Space h="md" />
				<FileInput
					label="音译歌词文件"
					value={romanLyricFile}
					onChange={setRomanLyricFile}
				/>
				<Space h="md" />
				<FileInput
					label="逐词歌词文件"
					value={dynamicLyricFile}
					onChange={setDynamicLyricFile}
				/>
				<Space h="xl" />
				<Button
					disabled={!originalLyricFile}
					onClick={async () => {
						if (originalLyricFile) {
							setLocalLyricModalLoading(true);
							try {
								const lyricsPath = `${plugin.pluginPath}/lyrics`;
								const cachedLyricPath = `${lyricsPath}/${musicId}.json`;
								if (!(await betterncm.fs.exists(lyricsPath))) {
									betterncm.fs.mkdir(lyricsPath);
								}
								const lrc = await originalLyricFile.text();
								const tlyric = (await translatedLyricFile?.text()) || "";
								const romalrc = (await romanLyricFile?.text()) || "";
								const yrc = (await dynamicLyricFile?.text()) || "";
								await betterncm.fs.writeFile(
									cachedLyricPath,
									JSON.stringify({
										sgc: false,
										sfy: false,
										qfy: false,
										lyricUser: {
											id: 0,
											status: 0,
											demand: 0,
											userid: 0,
											nickname: "手动添加的歌词",
											uptime: Date.now(),
										},
										lrc: {
											version: 0,
											lyric: lrc,
										},
										klyric: {
											version: 0,
											lyric: "",
										},
										tlyric: {
											version: 0,
											lyric: tlyric,
										},
										romalrc: {
											version: 0,
											lyric: romalrc,
										},
										yrc: {
											version: 0,
											lyric: yrc,
										},
										code: 200,
									}),
								);
								await reloadLyricByCurrentAudioId();
								setLocalLyricModalOpened(false);
							} catch (err) {
								warn("警告：歌词转换失败", err);
							}
							setLocalLyricModalLoading(false);
						}
					}}
				>
					使用该歌词
				</Button>
			</Modal>
		</div>
	);
};

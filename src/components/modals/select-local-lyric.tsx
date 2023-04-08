import { LoadingOverlay, Modal, Space, Button, FileInput } from "@mantine/core";
import { useAtom, useAtomValue } from "jotai";
import * as React from "react";
import { useReloadLyricByCurrentAudioId } from "../../api/react";
import {
	musicIdAtom,
	selectLocalLyricModalOpenedAtom,
} from "../../core/states";
import { warn } from "../../utils/logger";
import { getLyricCachePath } from "../../api";

export const SelectLocalLyricModal: React.FC = () => {
	const musicId = useAtomValue(musicIdAtom);
	const reloadLyricByCurrentAudioId = useReloadLyricByCurrentAudioId();
	const [selectLocalLyricModalOpened, setLocalLyricModalOpened] = useAtom(
		selectLocalLyricModalOpenedAtom,
	);
	const [selectLocalLyricModalLoading, setLocalLyricModalLoading] =
		React.useState(false);
	const [originalLyricFile, setOriginalLyricFile] = React.useState<File | null>(
		null,
	);
	const [translatedLyricFile, setTranslatedLyricFile] =
		React.useState<File | null>(null);
	const [romanLyricFile, setRomanLyricFile] = React.useState<File | null>(null);
	const [dynamicLyricFile, setDynamicLyricFile] = React.useState<File | null>(
		null,
	);

	return (
		<Modal
			title="导入歌词文件"
			opened={selectLocalLyricModalOpened}
			closeOnClickOutside={!selectLocalLyricModalLoading}
			onClose={() => setLocalLyricModalOpened(false)}
			centered
		>
			<LoadingOverlay
				visible={selectLocalLyricModalLoading}
				radius="sm"
				size={50}
				loaderProps={{
					style: {
						width: "50px",
						height: "50px",
					},
				}}
			/>
			<FileInput
				label="原文歌词文件"
				value={originalLyricFile}
				onChange={setOriginalLyricFile}
				accept=".lrc"
			/>
			<Space h="md" />
			<FileInput
				label="翻译歌词文件"
				value={translatedLyricFile}
				onChange={setTranslatedLyricFile}
				accept=".lrc"
			/>
			<Space h="md" />
			<FileInput
				label="音译歌词文件"
				value={romanLyricFile}
				onChange={setRomanLyricFile}
				accept=".lrc"
			/>
			<Space h="md" />
			<FileInput
				label="逐词歌词文件"
				value={dynamicLyricFile}
				onChange={setDynamicLyricFile}
				accept=".yrc,.lrc"
			/>
			<Space h="xl" />
			<Button
				disabled={!originalLyricFile}
				onClick={async () => {
					if (originalLyricFile) {
						setLocalLyricModalLoading(true);
						try {
							const lyricsPath = getLyricCachePath();
							const cachedLyricPath = `${lyricsPath}/${musicId}.json`;
							if (!(await betterncm.fs.exists(lyricsPath))) {
								betterncm.fs.mkdir(lyricsPath);
							}
							if (await betterncm.fs.exists(cachedLyricPath)) {
								await betterncm.fs.remove(cachedLyricPath);
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
	);
};

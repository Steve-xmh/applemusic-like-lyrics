import { Modal, Text, Space, Button, Slider } from "@mantine/core";
import { useAtom, useAtomValue } from "jotai";
import * as React from "react";
import { useConfigValue } from "../../api/react";
import {
	lyricOffsetAtom,
	musicIdAtom,
	adjustLyricOffsetModalOpenedAtom,
	currentRawLyricRespAtom,
} from "../../core/states";
import { warn } from "../../utils/logger";

export const AdjustLyricOffsetModal: React.FC = () => {
	const musicId = useAtomValue(musicIdAtom);
	const res = useAtomValue(currentRawLyricRespAtom);
	const [curOffset, setOffset] = useAtom(lyricOffsetAtom);
	const [modalOpened, setModalOpened] = useAtom(
		adjustLyricOffsetModalOpenedAtom,
	);
	const globalOffset =
		Number(useConfigValue("globalTimeStampOffset", "0")) || 0;

	return (
		<Modal
			title="设置当前歌曲歌词时序位移"
			opened={modalOpened}
			closeOnClickOutside
			onClose={() => setModalOpened(false)}
			zIndex={151}
			centered
		>
			<Text>注：本设置用于调节单独歌曲的位移，该位移将会和全局位移叠加。</Text>
			<Text>　　如果需要调节全局时序位移，请在插件设置内进行调整。</Text>
			<Slider
				sx={{ margin: "8px 0" }}
				min={-10}
				step={0.1}
				max={10}
				defaultValue={curOffset}
				label={(v: number) => {
					if (v === 0) {
						return "不调整";
					} else {
						if (globalOffset === 0) {
							if (v < 0) {
								return `推迟 ${(-v).toFixed(1)} 秒`;
							} else {
								return `提前 ${v.toFixed(1)} 秒`;
							}
						} else {
							const t = globalOffset + v;
							let msg = "在全局位移";
							if (globalOffset < 0) {
								msg += `推迟 ${(-globalOffset).toFixed(1)} 秒`;
							} else {
								msg += `提前 ${globalOffset.toFixed(1)} 秒`;
							}
							msg += "的基础上";
							if (curOffset < 0) {
								msg += `推迟 ${(-v).toFixed(1)} 秒`;
							} else {
								msg += `提前 ${v.toFixed(1)} 秒`;
							}
							if (Math.round(t * 10) === 0) {
								msg += "（即不调整）";
							} else if (t < 0) {
								msg += `（共计推迟 ${(-t).toFixed(1)} 秒）`;
							} else {
								msg += `（共计提前 ${t.toFixed(1)} 秒）`;
							}
							return msg;
						}
					}
				}}
				value={curOffset}
				onChange={(v: number) => setOffset(v)}
			/>
			<Space h="xl" />
			<Button
				onClick={async () => {
					setModalOpened(false);
					try {
						const lyricsPath = `${plugin.pluginPath}/lyrics`;
						const cachedLyricPath = `${lyricsPath}/${musicId}.json`;
						if (!(await betterncm.fs.exists(lyricsPath))) {
							betterncm.fs.mkdir(lyricsPath);
						}
						if (await betterncm.fs.exists(cachedLyricPath)) {
							await betterncm.fs.remove(cachedLyricPath);
						}
						await betterncm.fs.writeFile(cachedLyricPath, JSON.stringify(res));
					} catch (err) {
						warn("警告：歌曲歌词时序设置保存失败", err);
					}
				}}
			>
				保存
			</Button>
		</Modal>
	);
};

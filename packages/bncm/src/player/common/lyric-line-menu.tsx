import type { FC } from "react";
import { Menu, MenuDevider, MenuItem } from "../../components/appkit/menu";
import { LyricLine } from "@applemusic-like-lyrics/core";
import { atom, useAtom, useAtomValue } from "jotai";
import { musicContextAtom } from "../../music-context/wrapper";

export const rightClickedLyricAtom = atom<LyricLine | null>(null);

export const RightClickLyricMenu: FC = () => {
	const [rightClickedLyric, setRightClickedLyric] = useAtom(
		rightClickedLyricAtom,
	);
	const musicCtx = useAtomValue(musicContextAtom);
	const originalLyric =
		rightClickedLyric?.words?.map((v) => v.word).join("") || "";
	const translatedLyric = rightClickedLyric?.translatedLyric || "";
	const romanLyric = rightClickedLyric?.romanLyric || "";
	const wholeLyric = [originalLyric, translatedLyric, romanLyric]
		.filter((v) => !!v)
		.join("\n");
	return (
		<Menu
			opened={!!rightClickedLyric}
			onClose={() => setRightClickedLyric(null)}
		>
			<MenuItem
				label={
					rightClickedLyric ? `复制原歌词：${originalLyric}` : "未右键选中歌词"
				}
				onClick={() => {
					musicCtx?.setClipboard(originalLyric);
					setRightClickedLyric(null);
				}}
			/>
			{translatedLyric &&
				rightClickedLyric &&
				rightClickedLyric.translatedLyric && (
					<MenuItem
						label={`复制翻译歌词：${translatedLyric}`}
						onClick={() => {
							musicCtx?.setClipboard(rightClickedLyric.translatedLyric || "");
							setRightClickedLyric(null);
						}}
					/>
				)}
			{romanLyric && rightClickedLyric && rightClickedLyric.romanLyric && (
				<MenuItem
					label={`复制音译歌词：${romanLyric}`}
					onClick={() => {
						musicCtx?.setClipboard(rightClickedLyric.romanLyric || "");
						setRightClickedLyric(null);
					}}
				/>
			)}
			<MenuDevider />
			<MenuItem
				label="复制整行歌词"
				onClick={() => {
					if (rightClickedLyric) {
						musicCtx?.setClipboard(wholeLyric.trim());
					}
					setRightClickedLyric(null);
				}}
			/>
		</Menu>
	);
};

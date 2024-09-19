import {
	hideLyricViewAtom,
	isLyricPageOpenedAtom,
	onPlayOrResumeAtom,
	onRequestNextSongAtom,
	onRequestPrevSongAtom,
} from "@applemusic-like-lyrics/react-full";
import { ContextMenu } from "@radix-ui/themes";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import type { FC } from "react";
import { router } from "../../router";
import { musicIdAtom } from "../../states";

export const AMLLContextMenuContent: FC = () => {
	const [hideLyricView, setHideLyricView] = useAtom(hideLyricViewAtom);
	const setLyricPageOpened = useSetAtom(isLyricPageOpenedAtom);
	const onRequestPrevSong = useAtomValue(onRequestPrevSongAtom).onEmit;
	const onRequestNextSong = useAtomValue(onRequestNextSongAtom).onEmit;
	const onPlayOrResume = useAtomValue(onPlayOrResumeAtom).onEmit;
	const musicId = useAtomValue(musicIdAtom);

	return (
		<ContextMenu.Content>
			<ContextMenu.Item onClick={onRequestPrevSong}>上一首</ContextMenu.Item>
			<ContextMenu.Item onClick={onPlayOrResume}>暂停/继续</ContextMenu.Item>
			<ContextMenu.Item onClick={onRequestNextSong}>下一首</ContextMenu.Item>
			<ContextMenu.Separator />
			<ContextMenu.Item
				onClick={async () => {
					const win = getCurrentWindow();
					const isFullscreen = await win.isFullscreen();
					setSystemTitlebarFullscreen(!isFullscreen);
					await win.setFullscreen(!isFullscreen);
				}}
			>
				全屏/取消全屏
			</ContextMenu.Item>
			<ContextMenu.Separator />
			<ContextMenu.CheckboxItem
				checked={!hideLyricView}
				onCheckedChange={(e) => setHideLyricView(!e)}
			>
				显示歌词
			</ContextMenu.CheckboxItem>
			<ContextMenu.Item
				onClick={() => {
					setLyricPageOpened(false);
					router.navigate(`/song/${musicId}`);
				}}
			>
				编辑歌曲覆盖信息
			</ContextMenu.Item>
			<ContextMenu.Separator />
			<ContextMenu.Item
				onClick={() => {
					setLyricPageOpened(false);
				}}
			>
				退出歌词页面
			</ContextMenu.Item>
		</ContextMenu.Content>
	);
};

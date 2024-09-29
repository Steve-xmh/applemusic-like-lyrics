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
import { Trans } from "react-i18next";
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
			<ContextMenu.Item onClick={onRequestPrevSong}>
				<Trans i18nKey="amll.contextMenu.rewindSong">上一首</Trans>
			</ContextMenu.Item>
			<ContextMenu.Item onClick={onPlayOrResume}>
				<Trans i18nKey="amll.contextMenu.pauseOrResume">暂停 / 继续</Trans>
			</ContextMenu.Item>
			<ContextMenu.Item onClick={onRequestNextSong}>
				<Trans i18nKey="amll.contextMenu.forwardSong">下一首</Trans>
			</ContextMenu.Item>
			<ContextMenu.Separator />
			<ContextMenu.Item
				onClick={async () => {
					const win = getCurrentWindow();
					const isFullscreen = await win.isFullscreen();
					setSystemTitlebarFullscreen(!isFullscreen);
					await win.setFullscreen(!isFullscreen);
				}}
			>
				<Trans i18nKey="amll.contextMenu.toggleFullscreen">
					全屏 / 取消全屏
				</Trans>
			</ContextMenu.Item>
			<ContextMenu.Separator />
			<ContextMenu.CheckboxItem
				checked={!hideLyricView}
				onCheckedChange={(e) => setHideLyricView(!e)}
			>
				<Trans i18nKey="amll.contextMenu.toggleLyrics">显示歌词</Trans>
			</ContextMenu.CheckboxItem>
			<ContextMenu.Item
				onClick={() => {
					setLyricPageOpened(false);
					router.navigate(`/song/${musicId}`);
				}}
			>
				<Trans i18nKey="amll.contextMenu.editMusicOverrideMessage">
					编辑歌曲覆盖信息
				</Trans>
			</ContextMenu.Item>
			<ContextMenu.Separator />
			<ContextMenu.Item
				onClick={() => {
					setLyricPageOpened(false);
				}}
			>
				<Trans i18nKey="amll.contextMenu.exitLyricPage">退出歌词页面</Trans>
			</ContextMenu.Item>
		</ContextMenu.Content>
	);
};

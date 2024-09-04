import { Suspense, type FC } from "react";
import { Alert } from "../appkit/alert";
import { Atom, useAtomValue } from "jotai";
import {
	currentTimeAtom,
	currentVolumeAtom,
	lyricPageOpenedAtom,
	musicAlbumIdAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicCoverAtom,
	musicDurationAtom,
	musicIdAtom,
	musicNameAtom,
	musicOverrideDataAtom,
	musicQualityAtom,
	playModeAtom,
	playStatusAtom,
} from "../../music-context/wrapper";
import { lyricLinesAtom } from "../../lyric/provider";
import { exportTTML } from "@applemusic-like-lyrics/ttml";

const DebugValue: FC<{
	label: string;
	atom: Atom<any>;
}> = ({ label, atom }) => {
	const atomValue = useAtomValue(atom);
	return (
		<>
			<div>{label}</div>
			<div>
				<Suspense>
					{typeof atomValue !== "object" && typeof atomValue !== "function"
						? String(atomValue)
						: JSON.stringify(atomValue, null, 2)}
				</Suspense>
			</div>
		</>
	);
};

const TTMLDebugValue: FC = () => {
	const lyricLines = useAtomValue(lyricLinesAtom);
	const musicId = useAtomValue(musicIdAtom);
	const musicName = useAtomValue(musicNameAtom);
	const musicArtists = useAtomValue(musicArtistsAtom);
	return (
		<>
			<div>TTML 歌词数据</div>
			<div>
				{lyricLines.state === "hasData"
					? exportTTML({
							lyricLines: lyricLines.data,
							metadata: [
								{
									key: "ncmMusicId",
									value: [`${musicId}`],
								},
								{
									key: "musicName",
									value: [`${musicName}`],
								},
								{
									key: "artists",
									value: musicArtists.map((v) => v.name),
								},
								{
									key: "album",
									value: musicArtists.map((v) => v.name),
								},
							],
						})
					: null}
			</div>
		</>
	);
};

export const DebugConfig: FC = () => {
	const values: [string, Atom<any>][] = [
		["音乐ID", musicIdAtom],
		["音乐播放进度", currentTimeAtom],
		["音乐时长", musicDurationAtom],
		["音乐名称", musicNameAtom],
		["音乐作者", musicArtistsAtom],
		["音乐专辑封面链接", musicCoverAtom],
		["音乐专辑ID", musicAlbumIdAtom],
		["音乐专辑名称", musicAlbumNameAtom],
		["音乐音质", musicQualityAtom],
		["当前播放列表模式", playModeAtom],
		["当前播放状态", playStatusAtom],
		["当前音量", currentVolumeAtom],
		["歌词页面是否开启", lyricPageOpenedAtom],
		["音乐覆盖信息", musicOverrideDataAtom],
		["歌词数据", lyricLinesAtom],
	];
	return (
		<>
			<Alert type="warning" title="注意">
				本页面会列出几乎所有内部状态信息，供调试参考使用。
				<br />
				信息可能会产生频繁变动，保持本页面开启可能会影响性能。
			</Alert>
			<div className="amll-debug-states">
				{values.map(([label, atom]) => (
					<DebugValue key={label} label={label} atom={atom} />
				))}
				<TTMLDebugValue />
			</div>
		</>
	);
};

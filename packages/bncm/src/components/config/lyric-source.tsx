import { useMemo, type FC, useState } from "react";
import { GroupBox } from "../appkit/group-box";
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai";
import { lyricSourcesAtom } from "./atoms";
import { ReactSortable, type ItemInterface } from "react-sortablejs";
import {
	LyricFormat,
	LyricSource,
	parseSourceString,
	stringifySourceString,
} from "../../lyric/source";
import IconHandle from "../../assets/icon_handle.svg?react";
import IconMoreCircle from "../../assets/icon_more_circle.svg?react";
import { TextField } from "../appkit/text-field";
import { Button } from "../appkit/button";
import { Select } from "../appkit/select";
import { Menu, MenuDevider, MenuItem } from "../appkit/menu";
import { lyricProviderLogsAtom } from "../../lyric/provider";
import { v1 as uuidv1 } from "uuid";
import { setClipboardAtom } from "../../music-context/wrapper";

const sourceItemMenuAtom = atom<number | undefined>(undefined);

const sortableSourcesAtom = atom(
	(get): (ItemInterface & LyricSource)[] => {
		const lyricSources = get(lyricSourcesAtom);
		return lyricSources;
	},
	(get, set, update: (ItemInterface & LyricSource)[]) => {
		console.warn("updateSource", update);
		const old = get(lyricSourcesAtom);
		if (
			!old.every((a, index) => {
				const b = update[index];
				return (
					a.id === b.id &&
					a.type === b.type &&
					a.desc === b.desc &&
					a.url === b.url &&
					a.format === b.format &&
					a.name === b.name &&
					a.website === b.website
				);
			})
		) {
			set(
				lyricSourcesAtom,
				update.map((v) => ({
					type: v.type,
					id: v.id,
					desc: v.desc,
					url: v.url,
					format: v.format,
					name: v.name,
					website: v.website,
				})),
			);
		}
	},
);

function getDisplayNameForSource(source: LyricSource | undefined) {
	if (source === undefined) return "未知歌词源";
	if (source.type === "external") {
		try {
			return source.name ?? `来自 ${new URL(source.url).host} 的歌词源`;
		} catch {}
		return `无名歌词源 (${source.id})`;
	} else if (source.type === "builtin:amll-ttml-db") {
		return "AMLL TTML 逐词歌词数据库（多源聚合）";
	} else if (source.type === "builtin:ncm") {
		return "网易云歌词源";
	} else {
		return "未知歌词源";
	}
}

const LyricSourceItem: FC<{
	source: LyricSource;
	index: number;
}> = ({ source, index }) => {
	const displayName = useMemo<string>(
		() => getDisplayNameForSource(source),
		[source],
	);
	const setSourceItemMenu = useSetAtom(sourceItemMenuAtom);
	return (
		<div
			className="amll-lyric-source-item"
			onContextMenu={(evt) => {
				evt.preventDefault();
				evt.stopPropagation();
				setSourceItemMenu(index);
			}}
		>
			<IconHandle className="amll-handle" width={12} height={12} />
			<div className="amll-source-info">
				<div className="name">{displayName}</div>
				{source.desc && <div className="desc">{source.desc}</div>}
			</div>
			<IconMoreCircle
				className="amll-source-more"
				onClick={() => setSourceItemMenu(index)}
				width="16px"
				height="16px"
			/>
		</div>
	);
};

const LyricSourceAddFromString: FC = () => {
	const [sourceString, setSourceString] = useState("");
	const [lyricSources, setLyricSources] = useAtom(lyricSourcesAtom);
	const sourceStringErr = useMemo(() => {
		if (sourceString.length === 0) return undefined;
		try {
			parseSourceString(sourceString);
			return undefined;
		} catch (err) {
			return `不是正确的歌词源字符串：${err}`;
		}
	}, [sourceString]);
	return (
		<GroupBox className="amll-lyric-source-add-group">
			<div>从歌词源字符串添加：</div>
			<TextField
				value={sourceString}
				onInput={(evt) => setSourceString(evt.currentTarget.value)}
				placeholder="歌词源字符串"
				errorText={sourceStringErr}
			/>
			<Button
				onClick={() => {
					const parsed = parseSourceString(sourceString);
					setLyricSources([parsed, ...lyricSources]);
					setSourceString("");
				}}
				disabled={!(sourceStringErr === undefined && sourceString.length > 0)}
			>
				添加
			</Button>
		</GroupBox>
	);
};

const LyricSourceAddManual: FC = () => {
	const [sourceName, setSourceName] = useState("");
	const [sourceUrl, setSourceUrl] = useState("");
	const [sourceWebsite, setSourceWebsite] = useState("");
	const [lyricType, setLyricType] = useState(LyricFormat.LRC);
	const [lyricSources, setLyricSources] = useAtom(lyricSourcesAtom);
	const isCorrectUrl = useMemo(() => {
		if (sourceUrl.length === 0) return true;
		try {
			new URL(sourceUrl);
			return true;
		} catch {
			return false;
		}
	}, [sourceUrl]);
	return (
		<GroupBox className="amll-lyric-source-add-group">
			<div>手动添加：</div>
			<TextField
				value={sourceName}
				onInput={(evt) => setSourceName(evt.currentTarget.value)}
				placeholder="歌词源名称"
			/>
			<TextField
				value={sourceUrl}
				errorText={isCorrectUrl ? undefined : "不是一个正确的链接"}
				onInput={(evt) => setSourceUrl(evt.currentTarget.value)}
				placeholder="歌词来源模板链接*"
			/>
			<div
				style={{
					display: "flex",
					gap: "8px",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<div>歌词文件格式*</div>
				<Select
					onChange={(value) => setLyricType(value)}
					value={lyricType}
					data={[
						{
							value: LyricFormat.LRC,
							label: "LyRiC 歌词",
						},
						{
							value: LyricFormat.TTML,
							label: "TTML 歌词",
						},
						{
							value: LyricFormat.YRC,
							label: "YRC 歌词（网易云逐词）",
						},
						{
							value: LyricFormat.QRC,
							label: "QRC 歌词（QQ音乐逐词）",
						},
						{
							value: LyricFormat.LYS,
							label: "Lyricify Syllable 歌词",
						},
					]}
				/>
			</div>
			<TextField
				value={sourceWebsite}
				onInput={(evt) => setSourceWebsite(evt.currentTarget.value)}
				placeholder="歌词源网站"
			/>
			<Button
				disabled={!(sourceUrl.length > 0 && isCorrectUrl)}
				onClick={() => {
					if (sourceUrl.length > 0 && isCorrectUrl) {
						setSourceName("");
						setSourceUrl("");
						setSourceWebsite("");
						setLyricSources([
							{
								id: uuidv1(),
								type: "external",
								name: sourceName.trim() || undefined,
								url: sourceUrl.trim(),
								format: lyricType,
								website: sourceWebsite.trim() || undefined,
							},
							...lyricSources,
						]);
					}
				}}
			>
				添加
			</Button>
		</GroupBox>
	);
};

const LyricSourceMenu: FC = () => {
	const [lyricSources, setLyricSources] = useAtom(sortableSourcesAtom);
	const [sourceItemMenu, setSourceItemMenu] = useAtom(sourceItemMenuAtom);
	const setClipboardData = useSetAtom(setClipboardAtom);
	return (
		<Menu
			opened={sourceItemMenu !== undefined}
			onClose={() => setSourceItemMenu(undefined)}
		>
			{sourceItemMenu !== undefined && lyricSources[sourceItemMenu] && (
				<>
					{sourceItemMenu > 0 && (
						<MenuItem
							label="向上移动"
							onClick={() => {
								const newList = [...lyricSources];
								[newList[sourceItemMenu - 1], newList[sourceItemMenu]] = [
									newList[sourceItemMenu],
									newList[sourceItemMenu - 1],
								];
								setLyricSources(newList);
								setSourceItemMenu(undefined);
							}}
						/>
					)}
					{sourceItemMenu < lyricSources.length - 1 && (
						<MenuItem
							label="向下移动"
							onClick={() => {
								const newList = [...lyricSources];
								[newList[sourceItemMenu + 1], newList[sourceItemMenu]] = [
									newList[sourceItemMenu],
									newList[sourceItemMenu + 1],
								];
								setLyricSources(newList);
								setSourceItemMenu(undefined);
							}}
						/>
					)}
					<MenuDevider />
					{lyricSources[sourceItemMenu]?.url?.length > 0 && (
						<MenuItem
							label="访问歌词源网站"
							onClick={() => {
								setSourceItemMenu(undefined);
							}}
						/>
					)}
					{!lyricSources[sourceItemMenu]?.type?.startsWith("builtin:") && (
						<>
							<MenuItem
								label="导出歌词源字符串"
								onClick={() => {
									setSourceItemMenu(undefined);
									const source = lyricSources[sourceItemMenu];
									if (source) {
										setClipboardData(stringifySourceString(source));
										console.log(
											source,
											"的歌词源字符串为",
											stringifySourceString(source),
										);
									}
								}}
							/>
							<MenuDevider />
							<MenuItem
								label="删除歌词源"
								onClick={() => {
									const source = lyricSources[sourceItemMenu];
									setLyricSources(
										lyricSources.filter((v) => v.id !== source.id),
									);
									setSourceItemMenu(undefined);
								}}
							/>
						</>
					)}
				</>
			)}
		</Menu>
	);
};

const LyricSourceSearchLogs: FC = () => {
	const lyricSearchLogs = useAtomValue(lyricProviderLogsAtom);
	const sources = useAtomValue(lyricSourcesAtom);
	return (
		<GroupBox className="lyric-search-logs">
			<div className="lyric-search-logs-title">当前歌曲歌词搜索日志</div>
			<div className="logs">
				{lyricSearchLogs.map((log, i) => (
					<div key={`${log.sourceId}-${i}`}>
						<div className="source">
							{getDisplayNameForSource(
								sources.find((s) => s.id === log.sourceId),
							)}
						</div>
						<div className="log">{log.log}</div>
					</div>
				))}
			</div>
		</GroupBox>
	);
};
export const LyricSourceConfig: FC = () => {
	const [lyricSources, setLyricSources] = useAtom(sortableSourcesAtom);
	return (
		<>
			<GroupBox>歌词将会从上到下依次查询，可拖拽或右键菜单改变顺序</GroupBox>
			<GroupBox>
				<ReactSortable
					className="amll-lyric-sources-list"
					list={lyricSources}
					setList={setLyricSources}
				>
					{lyricSources.map((s, i) => (
						<LyricSourceItem source={s} index={i} key={s.id} />
					))}
				</ReactSortable>
			</GroupBox>
			<LyricSourceAddFromString />
			<LyricSourceAddManual />
			<LyricSourceMenu />
			<LyricSourceSearchLogs />
		</>
	);
};

import { useMemo, type FC, useState } from "react";
import { GroupBox } from "../appkit/group-box";
import { atom, useAtom, useSetAtom } from "jotai";
import { lyricSourcesAtom } from "./atoms";
import { ReactSortable, type ItemInterface } from "react-sortablejs";
import { LyricFormat, LyricSource } from "../../lyric/source";
import IconHandle from "../../assets/icon_handle.svg";
import IconMoreCircle from "../../assets/icon_more_circle.svg";
import { TextField } from "../appkit/text-field";
import { Button } from "../appkit/button";
import { Select } from "../appkit/select";
import { Menu, MenuDevider, MenuItem } from "../appkit/menu";

const sourceItemMenuAtom = atom<number | undefined>(undefined);

const sortableSourcesAtom = atom<
	Promise<(ItemInterface & LyricSource)[]>,
	[(ItemInterface & LyricSource)[]],
	void
>(
	async (get) => {
		const lyricSources = await get(lyricSourcesAtom);
		return lyricSources;
	},
	(_get, set, update) => {
		set(
			lyricSourcesAtom,
			update.map((v) => ({
				type: v.type,
				id: v.id,
				url: v.url,
				format: v.format,
				name: v.name,
				website: v.website,
			})),
		);
	},
);

const LyricSourceItem: FC<{
	source: LyricSource;
	index: number;
}> = ({ source, index }) => {
	const displayName = useMemo<string>(() => {
		if (source.type === "external") {
			try {
				return source.name ?? `来自 ${new URL(source.url).host} 的歌词源`;
			} catch {}
			return `无名歌词源 (${source.id})`;
		} else if (source.type === "builtin:amll-ttml-db") {
			return "AMLL TTML 逐词歌词数据库 (Github)";
		} else if (source.type === "builtin:ncm") {
			return "网易云歌词源";
		} else {
			return "未知歌词源";
		}
	}, [source]);
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
	return (
		<GroupBox className="amll-lyric-source-add-group">
			<div>从歌词源字符串添加：</div>
			<TextField
				value={sourceString}
				onInput={(evt) => setSourceString(evt.currentTarget.value)}
				placeholder="歌词源字符串"
			/>
			<Button>添加</Button>
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
				onClick={() => {
					setLyricSources([
						{
							id: crypto.randomUUID(),
							type: "external",
							name: sourceName.trim() || undefined,
							url: sourceUrl.trim(),
							format: lyricType,
							website: sourceWebsite.trim() || undefined,
						},
						...lyricSources,
					]);
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
		</>
	);
};

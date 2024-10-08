import type { TTMLLyric } from "@applemusic-like-lyrics/lyric";
import {
	Button,
	Callout,
	Card,
	Dialog,
	Flex,
	Spinner,
	Text,
	TextField,
} from "@radix-ui/themes";
import { open } from "@tauri-apps/plugin-shell";
import { useLiveQuery } from "dexie-react-hooks";
import { type FC, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { type TTMLDBLyricEntry, db } from "../../dexie";
import styles from "./index.module.css";

function getMetadataValue(ttml: TTMLLyric, key: string) {
	let result = "";
	for (const [k, v] of ttml.metadata) {
		if (k === key) {
			result += v.join(", ");
		}
	}
	return result;
}

function isTTMLEntryMatch(entry: TTMLDBLyricEntry, pattern: string | RegExp) {
	const result = {
		name: entry.name,
		raw: entry.raw,
		songName: getMetadataValue(entry.content, "musicName"),
		songArtists: getMetadataValue(entry.content, "artists"),
		matchedLinePreview: [] as string[],
	};

	for (let i = 0; i < entry.content.lines.length; i++) {
		const text = entry.content.lines[i].words.map((w) => w.word).join("");
		const matched = text.toLowerCase().match(pattern);
		if (matched) {
			result.matchedLinePreview = entry.content.lines
				.slice(i, i + 3)
				.map((l) => l.words.map((w) => w.word).join(""));
			break;
		}
	}
	if (result.matchedLinePreview.length) {
		return result;
	}
	if (result.name.match(pattern)) {
		return result;
	}
	if (result.songName.match(pattern)) {
		return result;
	}
	if (result.songArtists.match(pattern)) {
		return result;
	}
	return undefined;
}

export const TTMLImportDialog: FC<{
	onSelectedLyric?: (ttmlContent: string) => void;
}> = ({ onSelectedLyric }) => {
	const { t } = useTranslation();

	const [searchWord, setSearchWord] = useState("");
	const [opened, setOpened] = useState(false);

	const result = useLiveQuery(() => {
		const word = searchWord.trim();
		if (word.length > 0) {
			let pattern: string | RegExp = word.toLowerCase();
			try {
				pattern = new RegExp(word, "i");
			} catch {}
			return db.ttmlDB
				.toCollection()
				.reverse()
				.filter((x) => !!isTTMLEntryMatch(x, pattern))
				.limit(10)
				.sortBy("name")
				.then((x) =>
					x.map((x) => isTTMLEntryMatch(x, pattern)).filter((v) => !!v),
				);
		}
		return [];
	}, [searchWord]);

	return (
		<Dialog.Root open={opened} onOpenChange={setOpened}>
			<Dialog.Trigger>
				<Button>
					<Trans i18nKey="amll.ttmlImportDialog.openButtonLabel">
						从 AMLL TTML DB 搜索 / 导入歌词
					</Trans>
				</Button>
			</Dialog.Trigger>
			<Dialog.Content>
				<Dialog.Title>
					<Trans i18nKey="amll.ttmlImportDialog.title">
						从 AMLL TTML DB 搜索 / 导入歌词
					</Trans>
				</Dialog.Title>
				<TextField.Root
					placeholder={t(
						"amll.ttmlImportDialog.searchInput.placeholder",
						"搜索歌曲、歌词内容、歌手等……",
					)}
					type="text"
					onChange={(v) => setSearchWord(v.target.value)}
					value={searchWord}
				/>
				<Callout.Root mt="4">
					<Trans i18nKey="amll.ttmlImportDialog.tip">
						在上方输入搜索关键词，点击候选项即可将歌词内容直接导入到歌词数据中。
					</Trans>
				</Callout.Root>
				<Callout.Root mt="4" color="grass">
					<Text>
						<Trans i18nKey="amll.ttmlImportDialog.supportText">
							AMLL TTML DB 是由 AMLL
							社区爱好者们一同建设的开源无版权歌词数据库，想为 AMLL TTML DB
							贡献歌词吗？前往
							<Button
								variant="outline"
								onClick={() =>
									open("https://github.com/Steve-xmh/amll-ttml-db")
								}
								style={{
									verticalAlign: "baseline",
									margin: "0 0.5em",
									fontWeight: "bold",
								}}
							>
								GitHub 仓库
							</Button>
							即可知晓提交歌词流程！
						</Trans>
					</Text>
				</Callout.Root>
				{result ? (
					result.length === 0 ? (
						<div style={{ margin: "1em", textAlign: "center", opacity: "0.5" }}>
							<Trans i18nKey="amll.ttmlImportDialog.noResults">无结果</Trans>
						</div>
					) : (
						result.map((v) => (
							<Card key={v.name} asChild>
								<button
									className={styles.resultCard}
									type="button"
									onClick={() => {
										onSelectedLyric?.(v.raw);
										setOpened(false);
									}}
								>
									<div className={styles.name}>{v.name}</div>
									<div>
										{v.songArtists} - {v.songName}
									</div>
									{v.matchedLinePreview.length > 0 && (
										<ul>
											{v.matchedLinePreview.map((l, i) => (
												<li key={`${l}-${i}`}>{l}</li>
											))}
										</ul>
									)}
								</button>
							</Card>
						))
					)
				) : (
					<Spinner />
				)}
				<Flex gap="3" mt="4" justify="end">
					<Dialog.Close>
						<Button variant="soft">
							<Trans i18nKey="common.dialog.close">关闭</Trans>
						</Button>
					</Dialog.Close>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
};

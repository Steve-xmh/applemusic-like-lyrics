import { Button, Callout, Flex, Select, TextArea } from "@radix-ui/themes";
import {
	type FC,
	useCallback,
	useContext,
	useLayoutEffect,
	useState,
} from "react";
import { db } from "../../dexie";
import { Option } from "./common";
import { SongContext } from "./song-ctx";

export const LyricTabContent: FC = () => {
	const song = useContext(SongContext);
	const [lyricFormat, setLyricFormat] = useState("none");
	const [lyricContent, setLyricContent] = useState("");
	const [translatedLyricContent, setTranslatedLyricContent] = useState("");
	const [romanLyricContent, setRomanLyricContent] = useState("");

	useLayoutEffect(() => {
		if (song) {
			setLyricFormat(song.lyricFormat);
			setLyricContent(song.lyric);
		} else {
			setLyricFormat("none");
			setLyricContent("");
		}
	}, [song]);

	const saveData = useCallback(() => {
		if (song === undefined) return;
		db.songs.update(song, (song) => {
			song.lyric = lyricFormat;
			if (lyricFormat === "none") {
				song.lyricFormat = "none";
				song.lyric = "";
				song.translatedLrc = "";
				song.romanLrc = "";
				return;
			}
			if (lyricFormat === "ttml") {
				song.lyricFormat = "ttml";
				song.lyric = lyricContent;
				song.translatedLrc = "";
				song.romanLrc = "";
				return;
			}
			song.lyricFormat = lyricFormat;
			song.lyric = lyricContent;
			song.translatedLrc = translatedLyricContent;
			song.romanLrc = romanLyricContent;
		});
	}, [
		song,
		lyricFormat,
		lyricContent,
		translatedLyricContent,
		romanLyricContent,
	]);

	return (
		<>
			<Flex direction="column" gap="4">
				<Option label="歌词格式">
					<Select.Root
						defaultValue="none"
						onValueChange={(v) => setLyricFormat(v)}
					>
						<Select.Trigger />
						<Select.Content>
							<Select.Item value="none">无歌词</Select.Item>
							<Select.Item value="lrc">LyRiC 歌词</Select.Item>
							<Select.Item value="eslrc">ESLyRiC 歌词</Select.Item>
							<Select.Item value="yrc">YRC 歌词</Select.Item>
							<Select.Item value="qrc">QRC 歌词</Select.Item>
							<Select.Item value="lys">Lyricify Syllable 歌词</Select.Item>
							<Select.Item value="ttml">TTML 歌词</Select.Item>
						</Select.Content>
					</Select.Root>
				</Option>
				{lyricFormat !== "none" && lyricFormat.length > 0 && (
					<>
						<Option label="歌词数据">
							<TextArea
								value={lyricContent}
								style={{
									minHeight: "10rem",
								}}
								onChange={(v) => setLyricContent(v.currentTarget.value)}
							/>
						</Option>

						{lyricFormat === "ttml" ? (
							<Callout.Root>
								<Callout.Text>TTML 歌词可同时包含翻译与音译数据。</Callout.Text>
							</Callout.Root>
						) : (
							<>
								<Option label="翻译歌词数据">
									<Callout.Root>
										<Callout.Text>
											请提供 LyRiC
											格式的歌词数据，将会根据时间戳与一致或靠近的原文歌词配对成为译文
										</Callout.Text>
									</Callout.Root>
									<TextArea
										value={translatedLyricContent}
										style={{
											minHeight: "10rem",
										}}
										onChange={(v) =>
											setTranslatedLyricContent(v.currentTarget.value)
										}
									/>
								</Option>

								<Option label="音译歌词数据">
									<Callout.Root>
										<Callout.Text>
											请提供 LyRiC
											格式的歌词数据，将会根据时间戳与一致或靠近的原文歌词配对成为音译
										</Callout.Text>
									</Callout.Root>
									<TextArea
										value={romanLyricContent}
										style={{
											minHeight: "10rem",
										}}
										onChange={(v) =>
											setRomanLyricContent(v.currentTarget.value)
										}
									/>
								</Option>
							</>
						)}
					</>
				)}
			</Flex>
			<Button mt="4" onClick={saveData}>
				保存
			</Button>
		</>
	);
};

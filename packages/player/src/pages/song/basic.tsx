import { toDuration } from "@applemusic-like-lyrics/react-full";
import { CopyIcon } from "@radix-ui/react-icons";
import { Code, DataList, Flex, IconButton } from "@radix-ui/themes";
import { type FC, useContext } from "react";
import { Trans, useTranslation } from "react-i18next";
import { SongContext } from "./song-ctx.ts";

export const BasicTabContent: FC = () => {
	const song = useContext(SongContext);
	useTranslation();
	return (
		<DataList.Root>
			<DataList.Item>
				<DataList.Label>
					<Trans i18nKey="page.song.basic.musicId">音乐 ID</Trans>
				</DataList.Label>
				<DataList.Value>{song?.id || "未知"}</DataList.Value>
			</DataList.Item>
			<DataList.Item>
				<DataList.Label>
					<Trans i18nKey="page.song.basic.musicFilePath">音乐文件路径</Trans>
				</DataList.Label>
				<DataList.Value>
					<Flex align="center" gap="2">
						<Code variant="ghost">{song?.filePath}</Code>
						<IconButton
							size="1"
							aria-label="Copy value"
							color="gray"
							variant="ghost"
							onClick={() => {
								navigator.clipboard.writeText(song?.filePath || "");
							}}
						>
							<CopyIcon />
						</IconButton>
					</Flex>
				</DataList.Value>
			</DataList.Item>
			<DataList.Item>
				<DataList.Label>
					<Trans i18nKey="page.song.basic.musicDuration">音乐时长</Trans>
				</DataList.Label>
				<DataList.Value>{toDuration(song?.duration || 0)}</DataList.Value>
			</DataList.Item>
		</DataList.Root>
	);
};

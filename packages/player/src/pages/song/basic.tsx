import { toDuration } from "@applemusic-like-lyrics/react-full";
import { CopyIcon } from "@radix-ui/react-icons";
import { Code, DataList, Flex, IconButton } from "@radix-ui/themes";
import { type FC, useContext } from "react";
import { SongContext } from "./song-ctx";

export const BasicTabContent: FC = () => {
	const song = useContext(SongContext);
	return (
		<DataList.Root>
			<DataList.Item>
				<DataList.Label>音乐 ID</DataList.Label>
				<DataList.Value>{song?.id || "未知"}</DataList.Value>
			</DataList.Item>
			<DataList.Item>
				<DataList.Label>音乐文件路径</DataList.Label>
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
				<DataList.Label>音乐时长</DataList.Label>
				<DataList.Value>{toDuration(song?.duration || 0)}</DataList.Value>
			</DataList.Item>
		</DataList.Root>
	);
};

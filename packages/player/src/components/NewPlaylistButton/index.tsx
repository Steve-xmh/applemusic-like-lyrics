import { PlusIcon } from "@radix-ui/react-icons";
import { Button, Dialog, Flex, TextField } from "@radix-ui/themes";
import { Trans } from "react-i18next";
import { db } from "../../dexie";
import { useState, type FC } from "react";

export const NewPlaylistButton: FC = () => {
	const [name, setName] = useState("");

	return (
		<Dialog.Root>
			<Dialog.Trigger>
				<Button variant="soft">
					<PlusIcon />
					新建播放列表
				</Button>
			</Dialog.Trigger>
			<Dialog.Content maxWidth="450px">
				<Dialog.Title>
					<Trans key="newPlaylistDialogTitle">新建歌单</Trans>
				</Dialog.Title>
				<TextField.Root
					placeholder="歌单名称"
					value={name}
					onChange={(e) => setName(e.currentTarget.value)}
				/>
				<Flex gap="3" mt="4" justify="end">
					<Dialog.Close>
						<Button variant="soft" color="gray">
							取消
						</Button>
					</Dialog.Close>
					<Dialog.Close>
						<Button
							onClick={() => {
								db.playlists.add({
									name,
									createTime: Date.now(),
									updateTime: Date.now(),
									playTime: 0,
									songIds: [],
								});
							}}
						>
							新建
						</Button>
					</Dialog.Close>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
};

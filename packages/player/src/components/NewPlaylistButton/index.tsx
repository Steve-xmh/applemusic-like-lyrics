import { PlusIcon } from "@radix-ui/react-icons";
import { Button, Dialog, Flex, TextField } from "@radix-ui/themes";
import { type FC, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { db } from "../../dexie";

export const NewPlaylistButton: FC = () => {
	const [name, setName] = useState("");
	const { t } = useTranslation();

	return (
		<Dialog.Root>
			<Dialog.Trigger>
				<Button variant="soft">
					<PlusIcon />
					<Trans i18nKey="newPlaylist.buttonLabel">新建播放列表</Trans>
				</Button>
			</Dialog.Trigger>
			<Dialog.Content maxWidth="450px">
				<Dialog.Title>
					<Trans i18nKey="newPlaylist.dialog.title">新建歌单</Trans>
				</Dialog.Title>
				<TextField.Root
					placeholder={t("newPlaylist.dialog.namePlaceholder", "歌单名称")}
					value={name}
					onChange={(e) => setName(e.currentTarget.value)}
				/>
				<Flex gap="3" mt="4" justify="end">
					<Dialog.Close>
						<Button variant="soft" color="gray">
							<Trans i18nKey="common.dialog.cancel">取消</Trans>
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
							<Trans i18nKey="common.dialog.confirm">确认</Trans>
						</Button>
					</Dialog.Close>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
};

import { GearIcon } from "@radix-ui/react-icons";
import { Button, Dialog, Flex, Separator, Text } from "@radix-ui/themes";
import { Trans } from "react-i18next";
import { commit, branch } from "virtual:git-metadata-plugin";

export const SettingsButton: React.FC = () => {
	return (
		<Dialog.Root>
			<Dialog.Trigger>
				<Button variant="soft">
					<GearIcon />
					设置
				</Button>
			</Dialog.Trigger>
			<Dialog.Content maxWidth="600px">
				<Dialog.Title>
					<Trans key="newPlaylistDialogTitle">设置</Trans>
				</Dialog.Title>

				<Separator my="3" size="4" />
				<Text weight="medium" size="4" my="4" as="div">
					关于
				</Text>
				<Text as="div">Apple Music-like Lyrics Player</Text>
				<Text as="div" style={{ opacity: "0.5" }}>
					{commit.substring(0, 7)} {branch}
				</Text>
				<Text as="div">由 SteveXMH 及其所有 Github 协作者共同开发</Text>

				<Flex gap="3" mt="4" justify="end">
					<Dialog.Close>
						<Button variant="soft" color="gray">
							关闭
						</Button>
					</Dialog.Close>
				</Flex>
			</Dialog.Content>
		</Dialog.Root>
	);
};

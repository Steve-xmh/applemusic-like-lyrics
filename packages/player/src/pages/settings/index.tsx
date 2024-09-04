import { Button, Text, Separator, Flex } from "@radix-ui/themes";
import type { FC } from "react";
import { commit, branch } from "virtual:git-metadata-plugin";
import { restartApp } from "../../utils/player";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

export const SettingsPage: FC = () => {
	return (
		<>
        <Flex align="end" mt="4" gap="4">
            <Button variant="soft" onClick={() => history.back()}>
                <ArrowLeftIcon />
                返回
            </Button>
        </Flex>
			<Separator my="3" size="4" />
			<Button onClick={() => restartApp()}>重启程序</Button>
			<Separator my="3" size="4" />
			<Text weight="medium" size="4" my="4" as="div">
				关于
			</Text>
			<Text as="div">Apple Music-like Lyrics Player</Text>
			<Text as="div" style={{ opacity: "0.5" }}>
				{commit.substring(0, 7)} {branch}
			</Text>
			<Text as="div">由 SteveXMH 及其所有 Github 协作者共同开发</Text>
		</>
	);
};

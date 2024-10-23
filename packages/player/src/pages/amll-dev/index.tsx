import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { Button, Card, Container, Flex, Text } from "@radix-ui/themes";
import type { FC } from "react";
import { Trans } from "react-i18next";
import { Link } from "react-router-dom";
import { useHideNowPlayingBar } from "../../utils/uses.ts";

export const Component: FC = () => {
	useHideNowPlayingBar();
	return (
		<Container
			mx={{
				initial: "4",
				sm: "9",
			}}
			mb="150px"
		>
			<Flex align="end" mt="7" gap="4">
				<Button variant="soft" onClick={() => history.back()}>
					<ArrowLeftIcon />
					<Trans i18nKey="common.page.back">返回</Trans>
				</Button>
			</Flex>
			<Text weight="bold" size="4" my="4" as="div">
				<Trans i18nKey="page.amll-dev.title">
					Apple Music Like Lyrics 开发者页面
				</Trans>
			</Text>
			<Text>
				<Trans i18nKey="page.amll-dev.warning">
					此处的东西用于开发调试用途，仅供作者方便之用，随便使用可能有意想不到的情况出现！（页面内容仅中文）
				</Trans>
			</Text>
			<Card asChild>
				<Link
					to="/amll-dev/mg-edit"
					style={{ width: "100%", display: "block" }}
				>
					<Flex px="2" direction="column" align="start">
						<Text weight="bold">AMLL MG 背景控制点测试</Text>
						<Text color="gray">拖拽控制点，并生成对应的预设代码</Text>
					</Flex>
				</Link>
			</Card>
		</Container>
	);
};

Component.displayName = "AMLLDevPage";

export default Component;

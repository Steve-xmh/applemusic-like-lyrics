import { Title, Button, Text } from "@mantine/core";
import { version } from "../../manifest.json";
import { useGithubLatestVersion, useHasUpdates } from "../react-api";

export const AboutPage: React.FC = () => {
	const latestVersion = useGithubLatestVersion();
	const hasUpdates = useHasUpdates();
	return (
		<>
			<Title order={2}>关于</Title>
			<Text>Apple Music-like lyrics</Text>
			<Text>{version}</Text>
			{hasUpdates && <Text>Github 有可用更新：{latestVersion}</Text>}
			<Text>By SteveXMH</Text>
			<Button.Group sx={{ margin: "8px 0" }} orientation="vertical">
				<Button
					variant="outline"
					onClick={() => {
						betterncm.ncm.openUrl(
							"https://github.com/Steve-xmh/applemusic-like-lyrics",
						);
					}}
				>
					Github
				</Button>
				{hasUpdates && (
					<Button
						variant="outline"
						onClick={() => {
							betterncm.ncm.openUrl(
								"https://github.com/Steve-xmh/applemusic-like-lyrics/releases/latest",
							);
						}}
					>
						前往 Github Release 下载最新版本
					</Button>
				)}
				{hasUpdates && (
					<Button
						variant="outline"
						onClick={() => {
							betterncm.ncm.openUrl(
								"https://ghproxy.com/https://github.com/Steve-xmh/applemusic-like-lyrics/releases/latest",
							);
						}}
					>
						前往 Github Release 下载最新版本（GHProxy 镜像）
					</Button>
				)}
			</Button.Group>
		</>
	);
};

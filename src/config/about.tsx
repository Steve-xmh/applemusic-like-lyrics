import { Title, Button, Text } from "@mantine/core";
import { version } from "../../manifest.json";

export const AboutPage: React.FC = () => {
	return (
		<>
			<Title order={2}>关于</Title>
			<Text>Apple Music-like lyrics</Text>
			<Text>{version}</Text>
			<Text>By SteveXMH</Text>
			<Button
				sx={{ margin: "8px 0" }}
				variant="outline"
				onClick={() => {
					betterncm.ncm.openUrl(
						"https://github.com/Steve-xmh/applemusic-like-lyrics",
					);
				}}
			>
				Github
			</Button>
		</>
	);
};

import { Button, Separator, Flex } from "@radix-ui/themes";
import type { FC } from "react";
import { ArrowLeftIcon } from "@radix-ui/react-icons";

export const SongPage: FC = () => {
	return (
		<>
			<Flex align="end" mt="4" gap="4">
				<Button variant="soft" onClick={() => history.back()}>
					<ArrowLeftIcon />
					返回
				</Button>
			</Flex>
			<Separator my="3" size="4" />
		</>
	);
};

import { Flex, Text } from "@radix-ui/themes";
import type { FC, PropsWithChildren } from "react";

export const Option: FC<
	PropsWithChildren<{
		label: string;
	}>
> = ({ label, children }) => (
	<Text as="label">
		<Flex gap="2" direction="column">
			{label}
			{children}
		</Flex>
	</Text>
);

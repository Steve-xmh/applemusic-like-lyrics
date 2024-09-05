import {
	Button,
	Text,
	TextProps,
	Separator,
	Flex,
	Card,
	Switch,
	TextField,
	Container,
} from "@radix-ui/themes";
import type { FC, PropsWithChildren } from "react";
import { commit, branch } from "virtual:git-metadata-plugin";
import { restartApp } from "../../utils/player";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { useAtom, type WritableAtom } from "jotai";
import {
	lyricBackgroundFPSAtom,
	lyricBackgroundRenderScaleAtom,
} from "@applemusic-like-lyrics/react-full";

const NumberSettings: FC<
	{
		label: string;
		description?: string;
		configAtom: WritableAtom<number, [number], void>;
	} & Omit<TextField.RootProps, "value" | "onChange">
> = ({ label, description, configAtom, ...props }) => {
	const [value, setValue] = useAtom(configAtom);

	return (
		<Card mt="2">
			<Flex direction="row" align="center" gap="4">
				<Flex direction="column" flexGrow="1">
					<Text as="div">{label}</Text>
					<Text as="div" color="gray" size="2">
						{description}
					</Text>
				</Flex>
				<TextField.Root
					{...props}
					style={{
						minWidth: "10em",
					}}
					value={value}
					onChange={(e) => setValue(Number(e.currentTarget.value) || 60)}
				/>
			</Flex>
		</Card>
	);
};

const SubTitle: FC<PropsWithChildren<TextProps>> = ({ children, ...props }) => {
	return (
		<Text weight="bold" size="4" my="4" as="div" {...props}>
			{children}
		</Text>
	);
};

export const SettingsPage: FC = () => {
	return (
		<Container
			mx={{
				initial: "4",
				sm: "9",
			}}
			mb="150px"
		>
			<Flex align="end" mt="4" gap="4">
				<Button variant="soft" onClick={() => history.back()}>
					<ArrowLeftIcon />
					返回
				</Button>
			</Flex>
			<SubTitle>歌词背景</SubTitle>

			<NumberSettings
				placeholder="60"
				type="number"
				min="1"
				max="1000"
				step="1"
				label="最高帧数"
				description="对性能影响较高，但是实际开销不大，如果遇到性能问题，可以尝试降低此值。默认值为 60。"
				configAtom={lyricBackgroundFPSAtom}
			/>
			<NumberSettings
				placeholder="1.0"
				type="number"
				min="0.01"
				max="10.0"
				step="0.01"
				label="渲染倍率"
				description="对性能影响较高，但是实际开销不大，如果遇到性能问题，可以尝试降低此值。默认值为 1 即每像素点渲染。"
				configAtom={lyricBackgroundRenderScaleAtom}
			/>

			<SubTitle>杂项</SubTitle>
			<Button onClick={() => restartApp()}>重启程序</Button>
			<Separator my="3" size="4" />
			<SubTitle>关于</SubTitle>
			<Text as="div">Apple Music-like Lyrics Player</Text>
			<Text as="div" style={{ opacity: "0.5" }}>
				{commit.substring(0, 7)} - {branch}
			</Text>
			<Text as="div">由 SteveXMH 及其所有 Github 协作者共同开发</Text>
		</Container>
	);
};

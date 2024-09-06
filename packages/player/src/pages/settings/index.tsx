import {
	enableLyricLineBlurEffectAtom,
	enableLyricLineScaleEffectAtom,
	enableLyricLineSpringAnimationAtom,
	enableLyricRomanLineAtom,
	enableLyricSwapTransRomanLineAtom,
	enableLyricTranslationLineAtom,
	lyricBackgroundFPSAtom,
	lyricBackgroundRenderScaleAtom,
	lyricBackgroundStaticModeAtom,
	lyricWordFadeWidthAtom,
} from "@applemusic-like-lyrics/react-full";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import {
	Button,
	Card,
	Container,
	Flex,
	Select,
	Separator,
	Switch,
	type SwitchProps,
	Text,
	TextField,
	type TextProps,
} from "@radix-ui/themes";
import { type WritableAtom, useAtom } from "jotai";
import type { ComponentProps, FC, PropsWithChildren } from "react";
import { branch, commit } from "virtual:git-metadata-plugin";
import { backgroundRendererAtom } from "../../states";
import { restartApp } from "../../utils/player";
import styles from "./index.module.css";

const SettingEntry: FC<
	PropsWithChildren<{
		label: string;
		description?: string;
	}>
> = ({ label, description, children }) => {
	return (
		<Card mt="2">
			<Flex direction="row" align="center" gap="4">
				<Flex direction="column" flexGrow="1">
					<Text as="div">{label}</Text>
					<Text as="div" color="gray" size="2" className={styles.desc}>
						{description}
					</Text>
				</Flex>
				{children}
			</Flex>
		</Card>
	);
};

const NumberSettings: FC<
	{
		configAtom: WritableAtom<number, [number], void>;
	} & ComponentProps<typeof SettingEntry> &
		Omit<TextField.RootProps, "value" | "onChange">
> = ({ label, description, configAtom, ...props }) => {
	const [value, setValue] = useAtom(configAtom);

	return (
		<SettingEntry label={label} description={description}>
			<TextField.Root
				{...props}
				style={{
					minWidth: "10em",
				}}
				value={value}
				onChange={(e) => setValue(Number(e.currentTarget.value) || 60)}
			/>
		</SettingEntry>
	);
};

const SwitchSettings: FC<
	{
		configAtom: WritableAtom<boolean, [boolean], void>;
	} & ComponentProps<typeof SettingEntry> &
		Omit<SwitchProps, "value" | "onChange">
> = ({ label, description, configAtom }) => {
	const [value, setValue] = useAtom(configAtom);

	return (
		<SettingEntry label={label} description={description}>
			<Switch checked={value} onCheckedChange={setValue} />
		</SettingEntry>
	);
};

const SelectSettings: FC<
	{
		configAtom: WritableAtom<string, [string], void>;
		menu: {
			label: string;
			value: string;
		}[];
	} & ComponentProps<typeof SettingEntry>
> = ({ label, description, menu, configAtom }) => {
	const [value, setValue] = useAtom(configAtom);

	return (
		<SettingEntry label={label} description={description}>
			<Select.Root value={value} onValueChange={setValue}>
				<Select.Trigger />
				<Select.Content>
					{menu.map((item) => (
						<Select.Item key={item.value} value={item.value}>
							{item.label}
						</Select.Item>
					))}
				</Select.Content>
			</Select.Root>
		</SettingEntry>
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
			<SubTitle>歌词内容</SubTitle>
			<SwitchSettings
				label="显示翻译歌词"
				configAtom={enableLyricTranslationLineAtom}
			/>
			<SwitchSettings
				label="显示音译歌词"
				configAtom={enableLyricRomanLineAtom}
			/>
			<SwitchSettings
				label="交换翻译和音译歌词行"
				description="仅上面两者启用后有效"
				configAtom={enableLyricSwapTransRomanLineAtom}
			/>

			<SubTitle>歌词样式</SubTitle>
			<SwitchSettings
				label="启用歌词模糊效果"
				description="对性能影响较高，如果遇到性能问题，可以尝试关闭此项。默认开启。"
				configAtom={enableLyricLineBlurEffectAtom}
			/>
			<SwitchSettings
				label="启用歌词缩放效果"
				description="对性能无影响，非当前播放歌词行会略微缩小。默认开启"
				configAtom={enableLyricLineScaleEffectAtom}
			/>
			<SwitchSettings
				label="启用歌词行弹簧动画效果"
				description="对性能影响较高，如果遇到性能问题，可以尝试关闭此项。默认开启。"
				configAtom={enableLyricLineSpringAnimationAtom}
			/>

			<NumberSettings
				placeholder="0.5"
				type="number"
				min="0"
				max="10.0"
				step="0.01"
				label="逐词渐变宽度"
				description={
					"调节逐词歌词时单词的渐变过渡宽度，单位为一个全角字的宽度，默认为 0.5。\n如果要模拟 Apple Music for Android 的效果，可以设置为 1。\n如果要模拟 Apple Music for iPad 的效果，可以设置为 0.5。\n如需关闭逐词歌词时单词的渐变过渡效果，可以设置为 0。"
				}
				configAtom={lyricWordFadeWidthAtom}
			/>

			<SubTitle>歌词背景</SubTitle>

			<SelectSettings
				label="背景渲染器"
				menu={[
					{
						label: "网格渐变渲染器（MeshGradientRenderer）",
						value: "mesh",
					},
					{
						label: "PixiJS 渲染器（PixiRenderer）",
						value: "pixi",
					},
				]}
				configAtom={backgroundRendererAtom}
			/>

			<NumberSettings
				placeholder="60"
				type="number"
				min="1"
				max="1000"
				step="1"
				label="背景最高帧数"
				description="对性能影响较高，但是实际开销不大，如果遇到性能问题，可以尝试降低此值。默认值为 60。"
				configAtom={lyricBackgroundFPSAtom}
			/>
			<NumberSettings
				placeholder="1.0"
				type="number"
				min="0.01"
				max="10.0"
				step="0.01"
				label="背景渲染倍率"
				description="对性能影响较高，但是实际开销不大，如果遇到性能问题，可以尝试降低此值。默认值为 1 即每像素点渲染。"
				configAtom={lyricBackgroundRenderScaleAtom}
			/>
			<SwitchSettings
				label="背景静态模式"
				description={
					"让背景会在除了切换歌曲变换封面的情况下保持静止，如果遇到了性能问题，可以考虑开启此项。\n注意：启用此项会导致背景跳动效果失效。"
				}
				configAtom={lyricBackgroundStaticModeAtom}
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

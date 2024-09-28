import {
	PlayerControlsType,
	enableLyricLineBlurEffectAtom,
	enableLyricLineScaleEffectAtom,
	enableLyricLineSpringAnimationAtom,
	enableLyricRomanLineAtom,
	enableLyricSwapTransRomanLineAtom,
	enableLyricTranslationLineAtom,
	lyricBackgroundFPSAtom,
	lyricBackgroundRenderScaleAtom,
	lyricBackgroundStaticModeAtom,
	lyricFontFamilyAtom,
	lyricFontWeightAtom,
	lyricLetterSpacingAtom,
	lyricWordFadeWidthAtom,
	playerControlsTypeAtom,
	showBottomControlAtom,
	showMusicAlbumAtom,
	showMusicArtistsAtom,
	showMusicNameAtom,
	showVolumeControlAtom,
} from "@applemusic-like-lyrics/react-full";
import { ArrowLeftIcon } from "@radix-ui/react-icons";
import {
	Box,
	Button,
	Card,
	Container,
	Flex,
	Select,
	Separator,
	Slider,
	type SliderProps,
	Switch,
	type SwitchProps,
	Text,
	TextField,
	type TextProps,
} from "@radix-ui/themes";
import { getVersion } from "@tauri-apps/api/app";
import { type WritableAtom, atom, useAtom, useAtomValue } from "jotai";
import { loadable } from "jotai/utils";
import {
	type ComponentProps,
	type FC,
	type PropsWithChildren,
	type ReactNode,
	Suspense,
	useLayoutEffect,
	useMemo,
	useState,
} from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { branch, commit } from "virtual:git-metadata-plugin";
import resources from "virtual:i18next-loader";
import { router } from "../../router";
import {
	advanceLyricDynamicLyricTimeAtom,
	backgroundRendererAtom,
	displayLanguageAtom,
	fftDataRangeAtom,
	showStatJSFrameAtom,
} from "../../states";
import { updateInfoAtom } from "../../states/updater";
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
				defaultValue={value}
				onChange={(e) => setValue(e.currentTarget.valueAsNumber)}
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

function SelectSettings<T extends string>({
	label,
	description,
	menu,
	configAtom,
}: {
	configAtom: WritableAtom<T, [T], void>;
	menu: {
		label: string;
		value: T;
	}[];
} & ComponentProps<typeof SettingEntry>): ReactNode {
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
}

function SliderSettings<T extends number | number[]>({
	label,
	description,
	configAtom,
	children,
	...rest
}: PropsWithChildren<{
	configAtom: WritableAtom<T, [T], void>;
}> &
	ComponentProps<typeof SettingEntry> &
	Omit<SliderProps, "value" | "onValueChange">): ReactNode {
	const [value, setValue] = useAtom(configAtom);

	return (
		<SettingEntry label={label} description={description}>
			<Slider
				value={typeof value === "number" ? [value] : value}
				onValueChange={(v: any) =>
					typeof value === "number" ? setValue(v[0]) : setValue(v)
				}
				{...rest}
			/>
			{children}
		</SettingEntry>
	);
}

const SubTitle: FC<PropsWithChildren<TextProps>> = ({ children, ...props }) => {
	return (
		<Text weight="bold" size="4" my="4" as="div" {...props}>
			{children}
		</Text>
	);
};

const LyricFontSetting: FC = () => {
	const [fontFamily, setFontFamily] = useAtom(lyricFontFamilyAtom);
	const [fontWeight, setFontWeight] = useAtom(lyricFontWeightAtom);
	const [letterSpacing, setLetterSpacing] = useAtom(lyricLetterSpacingAtom);
	const [preview, setPreview] = useState("字体预览 Font Preview");
	const { t } = useTranslation();

	useLayoutEffect(() => {
		setPreview(
			t(
				"page.settings.lyricFont.fontPreview.defaultText",
				"字体预览 Font Preview",
			),
		);
	}, [t]);

	return (
		<Card mt="2">
			<Flex direction="row" align="center" gap="4">
				<Flex direction="column" flexGrow="1">
					<Text as="div">
						<Trans i18nKey="page.settings.lyricFont.subtitle">
							歌词字体设置
						</Trans>
					</Text>
					<Text as="div" color="gray" size="2" className={styles.desc}>
						<Trans i18nKey="page.settings.lyricFont.tip">
							此设置仅设置歌词字体，不包含其他组件的字体
						</Trans>
					</Text>
				</Flex>
			</Flex>
			<Flex direction="row" align="center" gap="4" my="2">
				<Flex direction="column" flexGrow="1">
					<Text as="div">
						<Trans i18nKey="page.settings.lyricFont.fontFamily.label">
							字体家族
						</Trans>
					</Text>
					<Text as="div" color="gray" size="2" className={styles.desc}>
						<Trans i18nKey="page.settings.lyricFont.fontFamily.description">
							以逗号分隔的字体名称组合，等同于 CSS 的 font-family
							属性，留空为默认
						</Trans>
					</Text>
				</Flex>
				<TextField.Root
					value={fontFamily}
					onChange={(e) => setFontFamily(e.currentTarget.value)}
				/>
			</Flex>
			<Flex direction="row" align="center" gap="4" my="2">
				<Flex direction="column" flexGrow="1">
					<Text as="div">
						<Trans i18nKey="page.settings.lyricFont.fontWeight.label">
							字体字重
						</Trans>
					</Text>
					<Text as="div" color="gray" size="2" className={styles.desc}>
						<Trans i18nKey="page.settings.lyricFont.fontWeight.description">
							等同于 CSS 的 font-weight 属性，设置 0 为默认
						</Trans>
					</Text>
				</Flex>
				<TextField.Root
					value={fontWeight}
					type="number"
					min={0}
					max={1000}
					onChange={(e) => setFontWeight(e.currentTarget.valueAsNumber)}
				/>
				<Slider
					value={[fontWeight]}
					min={0}
					max={1000}
					style={{
						maxWidth: "10em",
					}}
					onValueChange={([value]) => setFontWeight(value)}
				/>
			</Flex>
			<Flex direction="row" align="center" gap="4" my="2">
				<Flex direction="column" flexGrow="1">
					<Text as="div">
						<Trans i18nKey="page.settings.lyricFont.letterSpacing.label">
							字符间距
						</Trans>
					</Text>
					<Text as="div" color="gray" size="2" className={styles.desc}>
						<Trans i18nKey="page.settings.lyricFont.letterSpacing.description">
							等同于 CSS 的 letter-spacing 属性，留空为默认
						</Trans>
					</Text>
				</Flex>
				<TextField.Root
					value={letterSpacing}
					onChange={(e) => setLetterSpacing(e.currentTarget.value)}
				/>
			</Flex>
			<Flex direction="row" align="center" gap="4" my="2">
				<Flex direction="column" flexGrow="1">
					<Text as="div">
						<Trans i18nKey="page.settings.lyricFont.fontPreview.label">
							字体预览
						</Trans>
					</Text>
				</Flex>
				<TextField.Root
					value={preview}
					onChange={(e) => setPreview(e.currentTarget.value)}
				/>
			</Flex>
			<Box
				style={{
					fontFamily: fontFamily || undefined,
					fontWeight: fontWeight || undefined,
					letterSpacing: letterSpacing || undefined,
					fontSize: "max(max(4.7vh, 3.2vw), 12px)",
					textAlign: "center",
				}}
			>
				{preview}
				<Box
					style={{
						fontSize: "max(0.5em, 10px)",
						opacity: "0.3",
					}}
				>
					{preview}
				</Box>
			</Box>
		</Card>
	);
};

const appVersionAtom = loadable(atom(() => getVersion()));

export const SettingsPage: FC = () => {
	const fftDataRange = useAtomValue(fftDataRangeAtom);
	const updateInfo = useAtomValue(updateInfoAtom);
	const appVersion = useAtomValue(appVersionAtom);
	const [updating] = useState(false);
	const { t, i18n } = useTranslation();

	const supportedLanguagesMenu = useMemo(() => {
		const menu = Object.keys(resources).map((langId) => {
			const name =
				new Intl.DisplayNames(i18n.language, {
					type: "language",
				}).of(langId) || langId;
			const origName =
				new Intl.DisplayNames(langId, {
					type: "language",
				}).of(langId) || langId;
			return {
				label: origName === name ? origName : `${origName} (${name})`,
				value: langId,
			};
		});
		menu.push({
			label: t("page.settings.general.displayLanguage.cimode", "本地化 ID"),
			value: "cimode",
		});
		return menu;
	}, [i18n.language]);

	const playerControlsTypeMenu = useMemo(
		() => [
			{
				label: t(
					"page.settings.musicInfoAppearance.playerControlsType.menu.controls",
					"播放控制组件",
				),
				value: PlayerControlsType.Controls,
			},
			{
				label: t(
					"page.settings.musicInfoAppearance.playerControlsType.menu.fft",
					"线条音频可视化",
				),
				value: PlayerControlsType.FFT,
			},
			{
				label: t(
					"page.settings.musicInfoAppearance.playerControlsType.menu.none",
					"无",
				),
				value: PlayerControlsType.None,
			},
		],
		[t],
	);

	const backgroundRendererMenu = useMemo(
		() => [
			{
				label: t(
					"page.settings.lyricBackground.menu.meshGradientRenderer",
					"网格渐变渲染器（MeshGradientRenderer）",
				),
				value: "mesh",
			},
			{
				label: t(
					"page.settings.lyricBackground.menu.pixiRenderer",
					"PixiJS 渲染器（PixiRenderer）",
				),
				value: "pixi",
			},
		],
		[t],
	);

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
			<SubTitle>
				<Trans i18nKey="page.settings.general.subtitle">常规</Trans>
			</SubTitle>
			<SelectSettings
				label={t("page.settings.general.displayLanguage", "显示语言")}
				menu={supportedLanguagesMenu}
				configAtom={displayLanguageAtom}
			/>
			<SubTitle>
				<Trans i18nKey="page.settings.lyricContent.subtitle">歌词内容</Trans>
			</SubTitle>
			<SwitchSettings
				label={t(
					"page.settings.lyricContent.enableLyricTranslationLine",
					"显示翻译歌词",
				)}
				configAtom={enableLyricTranslationLineAtom}
			/>
			<SwitchSettings
				label={t(
					"page.settings.lyricContent.enableLyricRomanLine.label",
					"显示音译歌词",
				)}
				configAtom={enableLyricRomanLineAtom}
			/>
			<SwitchSettings
				label={t(
					"page.settings.lyricContent.enableLyricSwapTransRomanLine.label",
					"启用音译歌词与翻译歌词互换",
				)}
				description={t(
					"page.settings.lyricContent.enableLyricSwapTransRomanLine.description",
					"仅上面两者启用后有效",
				)}
				configAtom={enableLyricSwapTransRomanLineAtom}
			/>

			<SubTitle>
				<Trans i18nKey="page.settings.lyricAppearance.subtitle">歌词样式</Trans>
			</SubTitle>
			<LyricFontSetting />

			<SwitchSettings
				label={t(
					"page.settings.lyricAppearance.enableLyricLineBlurEffect.label",
					"启用歌词模糊效果",
				)}
				description={t(
					"page.settings.lyricAppearance.enableLyricLineBlurEffect.description",
					"对性能影响较高，如果遇到性能问题，可以尝试关闭此项。默认开启。",
				)}
				configAtom={enableLyricLineBlurEffectAtom}
			/>
			<SwitchSettings
				label={t(
					"page.settings.lyricAppearance.enableLyricLineScaleEffect.label",
					"启用歌词缩放效果",
				)}
				description={t(
					"page.settings.lyricAppearance.enableLyricLineScaleEffect.description",
					"对性能无影响，非当前播放歌词行会略微缩小。默认开启",
				)}
				configAtom={enableLyricLineScaleEffectAtom}
			/>
			<SwitchSettings
				label={t(
					"page.settings.lyricAppearance.enableLyricLineSpringAnimation.label",
					"启用歌词行弹簧动画效果",
				)}
				description={t(
					"page.settings.lyricAppearance.enableLyricLineSpringAnimation.description",
					"对性能影响较高，如果遇到性能问题，可以尝试关闭此项。默认开启。",
				)}
				configAtom={enableLyricLineSpringAnimationAtom}
			/>
			<SwitchSettings
				label={t(
					"page.settings.lyricAppearance.advanceLyricDynamicLyricTime.label",
					"提前歌词行时序",
				)}
				description={t(
					"page.settings.lyricAppearance.advanceLyricDynamicLyricTime.description",
					"即将原歌词行的初始时间时序提前，以便在歌词滚动结束后刚好开始播放（逐词）歌词效果。这个行为更加接近 Apple Music 的效果，但是大部分情况下会导致歌词行末尾的歌词尚未播放完成便被切换到下一行。",
				)}
				configAtom={advanceLyricDynamicLyricTimeAtom}
			/>

			<NumberSettings
				placeholder="0.5"
				type="number"
				min="0"
				max="10.0"
				step="0.01"
				label={t(
					"page.settings.lyricAppearance.lyricWordFadeWidth.label",
					"逐词渐变宽度",
				)}
				description={t(
					"page.settings.lyricAppearance.lyricWordFadeWidth.description",
					"调节逐词歌词时单词的渐变过渡宽度，单位为一个全角字的宽度，默认为 0.5。\n如果要模拟 Apple Music for Android 的效果，可以设置为 1。\n如果要模拟 Apple Music for iPad 的效果，可以设置为 0.5。\n如需关闭逐词歌词时单词的渐变过渡效果，可以设置为 0。",
				)}
				configAtom={lyricWordFadeWidthAtom}
			/>

			<SubTitle>
				<Trans i18nKey="page.settings.musicInfoAppearance.subtitle">
					歌曲信息样式
				</Trans>
			</SubTitle>

			<SwitchSettings
				label={t(
					"page.settings.musicInfoAppearance.showMusicName.label",
					"显示歌曲名称",
				)}
				configAtom={showMusicNameAtom}
			/>
			<SwitchSettings
				label={t(
					"page.settings.musicInfoAppearance.showMusicArtists.label",
					"显示歌曲作者",
				)}
				configAtom={showMusicArtistsAtom}
			/>
			<SwitchSettings
				label={t(
					"page.settings.musicInfoAppearance.showMusicAlbum.label",
					"显示歌曲专辑名称",
				)}
				description={t(
					"page.settings.musicInfoAppearance.showMusicAlbum.description",
					"如果同时启用三个，布局上可能不太好看，请酌情调节。",
				)}
				configAtom={showMusicAlbumAtom}
			/>

			<Box height="1em" />

			<SwitchSettings
				label={t(
					"page.settings.musicInfoAppearance.showVolumeControl.label",
					"显示音量控制条",
				)}
				configAtom={showVolumeControlAtom}
			/>
			<SwitchSettings
				label={t(
					"page.settings.musicInfoAppearance.showBottomControl.label",
					"显示底部按钮组",
				)}
				description={t(
					"page.settings.musicInfoAppearance.showBottomControl.description",
					"在横向布局里是右下角的几个按钮，在竖向布局里是播放按钮下方的几个按钮",
				)}
				configAtom={showBottomControlAtom}
			/>

			<Box height="1em" />

			<SelectSettings
				label={t(
					"page.settings.musicInfoAppearance.playerControlsType.label",
					"播放控制组件类型",
				)}
				description={t(
					"page.settings.musicInfoAppearance.playerControlsType.description",
					"即歌曲信息下方的组件",
				)}
				menu={playerControlsTypeMenu}
				configAtom={playerControlsTypeAtom}
			/>

			<SliderSettings
				label={t(
					"page.settings.musicInfoAppearance.fftDataRange.label",
					"音频可视化频域范围",
				)}
				description={t(
					"page.settings.musicInfoAppearance.fftDataRange.description",
					"单位为赫兹（hz），此项会影响音频可视化和背景跳动效果的展示效果",
				)}
				configAtom={fftDataRangeAtom}
				min={1}
				max={22050}
			>
				<Text wrap="nowrap">
					{fftDataRange[0]} Hz - {fftDataRange[1]} Hz
				</Text>
			</SliderSettings>

			<SubTitle>
				<Trans i18nKey="page.settings.lyricBackground.subtitle">歌词背景</Trans>
			</SubTitle>

			<SelectSettings
				label={t(
					"page.settings.lyricBackground.backgroundRenderer.label",
					"背景渲染器",
				)}
				menu={backgroundRendererMenu}
				configAtom={backgroundRendererAtom}
			/>

			<NumberSettings
				placeholder="60"
				type="number"
				min="1"
				max="1000"
				step="1"
				label={t(
					"page.settings.lyricBackground.lyricBackgroundFPS.label",
					"背景最高帧数",
				)}
				description={t(
					"page.settings.lyricBackground.lyricBackgroundFPS.description",
					"对性能影响较高，但是实际开销不大，如果遇到性能问题，可以尝试降低此值。默认值为 60。",
				)}
				configAtom={lyricBackgroundFPSAtom}
			/>
			<NumberSettings
				placeholder="1.0"
				type="number"
				min="0.01"
				max="10.0"
				step="0.01"
				label={t(
					"page.settings.lyricBackground.lyricBackgroundRenderScale.label",
					"背景渲染倍率",
				)}
				description={t(
					"page.settings.lyricBackground.lyricBackgroundRenderScale.description",
					"对性能影响较高，但是实际开销不大，如果遇到性能问题，可以尝试降低此值。默认值为 1 即每像素点渲染。",
				)}
				configAtom={lyricBackgroundRenderScaleAtom}
			/>
			<SwitchSettings
				label={t(
					"page.settings.lyricBackground.lyricBackgroundStaticMode.label",
					"背景静态模式",
				)}
				description={t(
					"page.settings.lyricBackground.lyricBackgroundStaticMode.description",
					"让背景会在除了切换歌曲变换封面的情况下保持静止，如果遇到了性能问题，可以考虑开启此项。\n注意：启用此项会导致背景跳动效果失效。",
				)}
				configAtom={lyricBackgroundStaticModeAtom}
			/>

			<SubTitle>
				<Trans i18nKey="page.settings.others.subtitle">杂项</Trans>
			</SubTitle>
			<SwitchSettings
				label={t(
					"page.settings.others.showStatJSFrame.label",
					"显示性能统计信息",
				)}
				description={t(
					"page.settings.others.showStatJSFrame.description",
					"可以看到帧率、帧时间、内存占用（仅 Chromuim 系）等信息，对性能影响较小。",
				)}
				configAtom={showStatJSFrameAtom}
			/>
			<Button my="2" onClick={() => restartApp()}>
				<Trans i18nKey="page.settings.others.restartProgram">重启程序</Trans>
			</Button>
			<Button
				m="2"
				variant="soft"
				onClick={() => {
					router.navigate("/amll-dev");
				}}
			>
				<Trans i18nKey="page.settings.others.enterAmllDevPage">
					歌词页面开发用工具
				</Trans>
			</Button>
			<Separator my="3" size="4" />
			<SubTitle>
				<Trans i18nKey="page.about.subtitle">关于</Trans>
			</SubTitle>
			<Text as="div">Apple Music-like Lyrics Player</Text>
			<Text as="div" style={{ opacity: "0.5" }}>
				{appVersion.state === "hasData" ? `${appVersion.data} - ` : ""}
				{commit.substring(0, 7)} - {branch}
			</Text>
			<Text as="div">
				<Trans i18nKey="page.about.credits">
					由 SteveXMH 及其所有 Github 协作者共同开发
				</Trans>
			</Text>
			<Suspense>
				{/* biome-ignore lint/complexity/useOptionalChain: <explanation> */}
				{updateInfo && updateInfo.available && (
					<>
						<div id="updater">
							{t(
								"page.about.newVersion",
								"有可用更新从 {{currentVersion}} 升级至 {{nextVersion}}",
								{
									currentVersion: updateInfo.currentVersion,
									nextVersion: updateInfo.version,
								},
							)}
						</div>
						<div
							style={{
								margin: "1em 0",
								whiteSpace: "pre-wrap",
							}}
						>
							{updateInfo.body}
						</div>
						<Button
							disabled={updating}
							loading={updating}
							onClick={() => {
								const toastId = toast.loading(
									t(
										"page.about.updating",
										"正在更新，完成后将会自动重启，请稍后……",
									),
								);
								let contentLength: number | undefined = undefined;
								let receivedLength = 0;

								function getProgressSizeText() {
									const rec = `${(receivedLength / 1024 / 1024).toFixed(2)} MiB`;
									if (contentLength === undefined) {
										return `(${rec})`;
									}
									const total = `${(contentLength / 1024 / 1024).toFixed(2)} MiB`;
									return `(${rec} / ${total}) (${((receivedLength / contentLength) * 100).toFixed(1)}%)`;
								}

								const getDownloadMessage = (progressText) =>
									t(
										"page.about.downloading",
										"正在下载更新…… {{progressText}}",
										{ progressText },
									);

								updateInfo.downloadAndInstall((evt) => {
									switch (evt.event) {
										case "Started": {
											contentLength = evt.data.contentLength;
											toast.update(toastId, {
												render: getDownloadMessage(getProgressSizeText()),
											});
											break;
										}
										case "Progress": {
											receivedLength += evt.data.chunkLength;
											toast.update(toastId, {
												render: getDownloadMessage(getProgressSizeText()),
												progress:
													contentLength === undefined
														? null
														: receivedLength / contentLength,
											});
											break;
										}
										case "Finished":
											toast.update(toastId, {
												render: t(
													"page.about.installing",
													"正在安装更新，将会自动重启，请稍后……",
												),
												progress: null,
											});
											setTimeout(restartApp, 1000);
											break;
									}
								});
							}}
						>
							<Trans i18nKey="page.about.installUpdate">更新并安装</Trans>
						</Button>
					</>
				)}
			</Suspense>
		</Container>
	);
};

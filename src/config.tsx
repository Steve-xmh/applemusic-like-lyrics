import { createTheme, ThemeProvider } from "@mui/material/styles";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Switch from "@mui/material/Switch";
import TextField, { TextFieldProps } from "@mui/material/TextField";
import Checkbox from "@mui/material/Checkbox";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import Input from "@mui/material/Input";
import FormGroup from "@mui/material/FormGroup";
import Slider from "@mui/material/Slider";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import * as React from "react";
import { settingPrefix, tryFindEapiRequestFuncName, useConfig } from "./api";
import { incompatible, version } from "../manifest.json";
import { cssContent, reloadStylesheet } from ".";
import { render } from "react-dom";

const CheckBoxComponent: React.FC<{
	settingKey: string;
	label: string;
	disabled?: boolean;
}> = (props) => {
	const [settingValue, setSettingValue] = React.useState(
		localStorage.getItem(`${settingPrefix}${props.settingKey}`) === "true",
	);
	React.useEffect(() => {
		localStorage.setItem(
			`${settingPrefix}${props.settingKey}`,
			String(settingValue),
		);
		reloadStylesheet(cssContent);
	}, [settingValue]);
	return (
		<FormControlLabel
			control={
				<Switch
					checked={settingValue}
					onChange={() => setSettingValue(!settingValue)}
				/>
			}
			label={props.label}
		/>
	);
};

const TextConfigComponent: React.FC<
	{
		settingKey: string;
		onChange?: (value: string) => void;
		defaultValue: string;
	} & Omit<TextFieldProps, "onChange">
> = (props) => {
	const [settingValue, setSettingValue] = React.useState(
		localStorage.getItem(`${settingPrefix}${props.settingKey}`) ||
			props.defaultValue,
	);
	React.useEffect(() => {
		localStorage.setItem(
			`${settingPrefix}${props.settingKey}`,
			String(settingValue),
		);
		reloadStylesheet(cssContent);
	}, [settingValue]);
	const { onChange, ...otherProps } = props;
	return (
		<TextField
			value={settingValue}
			onChange={(evt) => {
				onChange?.(evt.target.value);
				setSettingValue(evt.target.value);
			}}
			{...otherProps}
		/>
	);
};

const SliderComponent: React.FC<{
	settingKey: string;
	min?: number;
	max?: number;
	step?: number;
	label: string;
}> = (props) => {
	const [settingValue, setSettingValue] = React.useState(
		Number(localStorage.getItem(`${settingPrefix}${props.settingKey}`)),
	);
	React.useEffect(() => {
		localStorage.setItem(
			`${settingPrefix}${props.settingKey}`,
			String(settingValue),
		);
		reloadStylesheet(cssContent);
	}, [settingValue]);
	return (
		<>
			<Typography gutterBottom>{props.label}</Typography>
			<Grid container spacing={2} alignItems="center">
				<Grid item />
				<Grid item xs>
					<Slider
						step={props.step}
						min={props.min}
						max={props.max}
						value={settingValue}
						onChange={(evt, v) => typeof v === "number" && setSettingValue(v)}
					/>
				</Grid>
				<Grid item>
					<Input
						size="small"
						value={settingValue}
						onChange={(evt) =>
							setSettingValue(
								evt.target.value === "" ? 0 : Number(evt.target.value),
							)
						}
					/>
				</Grid>
			</Grid>
		</>
	);
};

const ConfigComponent: React.FC = () => {
	const ncmPackageVersion = React.useMemo(
		() => APP_CONF.packageVersion as string,
		[],
	);
	const incompatiblePlugins = React.useMemo(() => {
		const plugins = Object.keys(loadedPlugins);
		return plugins.filter((id) => (incompatible as string[]).includes(id));
	}, []);
	const refinedNowPlayingInstalled = React.useMemo(
		() => Object.keys(loadedPlugins).includes("RefinedNowPlaying"),
		[],
	);

	const [eapiRequestFuncName, setEapiRequestFuncName] = React.useState(
		localStorage.getItem(`${settingPrefix}eapiRequestFuncName`) || "",
	);
	const [eapiRequestFuncBody, setEapiRequestFuncBody] = React.useState("");

	React.useEffect(() => {
		if (eapiRequestFuncName !== "") {
			const func = betterncm.ncm.findApiFunction(eapiRequestFuncName);
			if (func === null) {
				setEapiRequestFuncBody("");
			} else {
				if ("originalFunc" in func[0]) {
					setEapiRequestFuncBody((func[0].originalFunc as Function).toString());
				} else {
					setEapiRequestFuncBody(func.toString());
				}
			}
		} else {
			setEapiRequestFuncBody("");
		}
		localStorage.setItem(
			`${settingPrefix}eapiRequestFuncName`,
			eapiRequestFuncName,
		);
	}, [eapiRequestFuncName]);

	return (
		<div className="am-lyrics-settings">
			{incompatiblePlugins.length === 0 ? (
				<></>
			) : (
				<Alert severity="error">
					<AlertTitle>错误：检测到不兼容的插件</AlertTitle>
					检测到与本插件冲突的其它插件，请卸载以下插件，否则本插件有可能不能正常工作：
					{incompatible.map((id) => (
						<span key={id}>{id} </span>
					))}
				</Alert>
			)}
			{refinedNowPlayingInstalled ? (
				<Alert severity="warning">
					<AlertTitle>警告：检测到 RefinedNowPlaying 插件</AlertTitle>
					本插件将会全部替换 RefinedNowPlaying
					的歌词、专辑图、音乐信息等样式，RefinedNowPlaying
					中的部分设置选项将会失效。
				</Alert>
			) : (
				<></>
			)}
			<FormGroup>
				<Typography variant="h5">歌词样式设置</Typography>
				<CheckBoxComponent settingKey="lyricBlurEffect" label="歌词模糊效果" />
				<CheckBoxComponent settingKey="lyricScaleEffect" label="歌词缩放效果" />
				<CheckBoxComponent
					settingKey="lyricHidePassed"
					label="已播放歌词隐藏效果"
				/>
				<CheckBoxComponent
					settingKey="lyricBlurFadeInEffect"
					label="未播放歌词淡入效果"
				/>
				<TextConfigComponent
					label="字体颜色"
					settingKey="fontColor"
					defaultValue="rgba(255, 255, 255, 1)"
				/>
				<CheckBoxComponent
					settingKey="lyricAutoFontSize"
					label="自适应歌词字体大小"
				/>
				<SliderComponent
					step={1}
					min={8}
					max={64}
					settingKey="lyricFontSize"
					label="字体大小（像素）"
				/>
			</FormGroup>
			<FormGroup>
				<Typography variant="h5">歌曲信息样式设置</Typography>
				<CheckBoxComponent settingKey="alignLeftMusicName" label="歌名居左" />
				<CheckBoxComponent
					settingKey="alignLeftMusicAlias"
					label="歌曲别名居左"
				/>
				<CheckBoxComponent
					settingKey="alignLeftMusicArtists"
					label="歌手名居左"
				/>
				<CheckBoxComponent
					settingKey="alignLeftMusicAlbum"
					label="专辑名居左"
				/>
				<CheckBoxComponent
					settingKey="hideLeftMusicArtistsLabel"
					label="隐藏歌手名标签"
				/>
				<CheckBoxComponent
					settingKey="hideLeftMusicAlbumLabel"
					label="隐藏专辑名标签"
				/>
				<TextConfigComponent
					label="歌手名分隔符"
					settingKey="musicArtistsSeparator"
					defaultValue={`" - "`}
				/>
			</FormGroup>
			<FormGroup>
				<Typography variant="h5">其它样式</Typography>
				<CheckBoxComponent
					settingKey="autoHideControlBar"
					label="鼠标静止时自动隐藏播放栏和标题栏"
				/>
				<SliderComponent
					step={0.5}
					min={1}
					max={30}
					settingKey="autoHideDuration"
					label="鼠标静止隐藏间隔（秒）"
				/>
				<CheckBoxComponent
					settingKey="usePingFangFont"
					label="播放页面使用苹方字体（需要系统安装）"
				/>
				<Button
					variant="outlined"
					onClick={() => {
						betterncm.ncm.openUrl("https://github.com/paraself/PingFang-Fonts");
					}}
				>
					你可以在此下载安装苹方字体
				</Button>
			</FormGroup>
			<FormGroup>
				<Typography paragraph variant="h5">
					歌词来源设置
				</Typography>
				<Typography paragraph variant="body1">
					如果歌词无法正确显示，有可能是无法获取网易云请求函数，或者找到的函数并不是网易云请求函数，请确认此处的函数名称是对应你所使用的网易云版本的请求函数。
				</Typography>
				<Typography paragraph variant="body1">
					具体可以前往插件 Github 仓库查询或在 BetterNCM 讨论群内询问作者
					SteveXMH。
				</Typography>
				<Typography paragraph variant="body1" style={{ userSelect: "text" }}>
					当前网易云 core.js 版本：{ncmPackageVersion}
				</Typography>
				<TextField
					variant="outlined"
					label="网易云请求函数名称"
					defaultValue={eapiRequestFuncName}
					value={eapiRequestFuncName}
					onChange={(evt) => {
						setEapiRequestFuncName(evt.target.value);
					}}
				/>
				<Typography paragraph variant="body1" className="am-lyric-func-body">
					{eapiRequestFuncBody === ""
						? "无法找到该函数，歌词将无法工作"
						: `已找到函数，请自行确定是否是网易云请求函数：\n${eapiRequestFuncBody}`}
				</Typography>
				<ButtonGroup variant="outlined">
					<Button
						onClick={() => {
							const funcName = tryFindEapiRequestFuncName();
							setEapiRequestFuncName(funcName || "");
						}}
					>
						尝试搜索请求函数（方式一）
					</Button>
					<Button
						onClick={() => {
							const funcName = tryFindEapiRequestFuncName(true);
							setEapiRequestFuncName(funcName || "");
						}}
					>
						尝试搜索请求函数（方式二）
					</Button>
				</ButtonGroup>
			</FormGroup>
			<Typography paragraph variant="h5">
				关于
			</Typography>
			<Typography variant="body1">Apple Music-like lyrics</Typography>
			<Typography variant="body1">{version}</Typography>
			<Typography variant="body1">By SteveXMH</Typography>
			<Button
				variant="outlined"
				onClick={() => {
					betterncm.ncm.openUrl(
						"https://github.com/Steve-xmh/applemusic-like-lyrics",
					);
				}}
			>
				Github
			</Button>
		</div>
	);
};

plugin.onConfig(() => {
	const root = document.createElement("div");

	const theme = createTheme({
		palette: {
			mode: "dark",
		},
		typography: {
			fontFamily: "PingFang SC, sans-serif",
		},
	});

	render(
		<ThemeProvider theme={theme}>
			<ConfigComponent />
		</ThemeProvider>,
		root,
	);

	return root;
});

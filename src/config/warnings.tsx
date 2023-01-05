import * as React from "react";
import { Alert } from "@mantine/core";
import { incompatible } from "../../manifest.json";

export function useWarnings(): [string[], boolean] {
	const incompatiblePlugins = React.useMemo(() => {
		const plugins = Object.keys(loadedPlugins);
		return plugins.filter((id) => (incompatible as string[]).includes(id));
	}, []);
	const refinedNowPlayingInstalled = React.useMemo(
		() => Object.keys(loadedPlugins).includes("RefinedNowPlaying"),
		[],
	);
	return [incompatiblePlugins, refinedNowPlayingInstalled];
}

export function useHasWarnings() {
	const [incompatiblePlugins, refinedNowPlayingInstalled] = useWarnings();
	return incompatiblePlugins.length > 0 || refinedNowPlayingInstalled;
}

export const WarningsList: React.FC = () => {
	const [incompatiblePlugins, refinedNowPlayingInstalled] = useWarnings();
	return (
		<>
			{incompatiblePlugins.length === 0 ? (
				<></>
			) : (
				<Alert
					sx={{ margin: "16px 0" }}
					color="red"
					title="错误：检测到不兼容的插件"
				>
					检测到与本插件冲突的其它插件，请卸载以下插件，否则本插件有可能不能正常工作：
					{incompatible.map((id) => (
						<span key={id}>{id} </span>
					))}
				</Alert>
			)}
			{refinedNowPlayingInstalled ? (
				<Alert
					sx={{ margin: "16px 0" }}
					color="yellow"
					title="警告：检测到 RefinedNowPlaying 插件"
				>
					本插件将会全部替换 RefinedNowPlaying
					的歌词、专辑图、音乐信息等样式，RefinedNowPlaying
					中的部分设置选项将会失效。
				</Alert>
			) : (
				<></>
			)}
		</>
	);
};

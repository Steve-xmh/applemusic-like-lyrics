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
					title="错误：检测到不兼容的 RefinedNowPlaying 插件"
				>
					<div>AMLL 插件不会主动兼容 RNP 插件，效果和稳定性不做保证</div>
				</Alert>
			) : (
				<></>
			)}
		</>
	);
};

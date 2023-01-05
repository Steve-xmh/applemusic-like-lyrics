import { Title } from "@mantine/core";
import {
	SwitchConfigComponent,
	TextConfigComponent,
} from "./config-components";

export const SongInfoStyleSettings: React.FC = () => {
	return (
		<>
			<Title order={2}>歌曲信息样式设置</Title>
			<SwitchConfigComponent settingKey="alignLeftMusicName" label="歌名居左" />
			<SwitchConfigComponent
				settingKey="alignLeftMusicAlias"
				label="歌曲别名居左"
			/>
			<SwitchConfigComponent
				settingKey="alignLeftMusicArtists"
				label="歌手名居左"
			/>
			<SwitchConfigComponent
				settingKey="alignLeftMusicAlbum"
				label="专辑名居左"
			/>
			<SwitchConfigComponent
				settingKey="hideLeftMusicArtistsLabel"
				label="隐藏歌手名标签"
			/>
			<SwitchConfigComponent
				settingKey="hideLeftMusicAlbumLabel"
				label="隐藏专辑名标签"
			/>
			<TextConfigComponent
				label="歌手名分隔符"
				settingKey="musicArtistsSeparator"
				defaultValue={`" - "`}
			/>
		</>
	);
};

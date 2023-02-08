import { Title } from "@mantine/core";
import {
	SwitchConfigComponent,
	TextConfigComponent,
} from "./config-components";

export const SongInfoStyleSettings: React.FC = () => {
	return (
		<>
			<Title order={2}>歌曲信息样式设置</Title>
			<SwitchConfigComponent settingKey="hideAlbumImage" label="隐藏专辑图" />
			<SwitchConfigComponent settingKey="hideMusicName" label="隐藏歌名" />
			<SwitchConfigComponent settingKey="hideMusicAlias" label="隐藏歌曲别名" />
			<SwitchConfigComponent settingKey="hideMusicArtists" label="隐藏歌手名" />
			<SwitchConfigComponent settingKey="hideMusicAlbum" label="隐藏专辑名" />
			<SwitchConfigComponent
				settingKey="alignLeftAlbumImage"
				label="专辑图居左"
			/>
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
				settingKey="hideMusicArtistsLabel"
				label="隐藏歌手名标签"
			/>
			<SwitchConfigComponent
				settingKey="hideMusicAlbumLabel"
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

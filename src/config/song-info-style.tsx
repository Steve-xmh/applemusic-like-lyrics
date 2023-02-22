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
			<SwitchConfigComponent settingKey="hideMusicArtists" label="隐藏歌手名" />
			<TextConfigComponent
				label="歌手名分隔符"
				settingKey="musicArtistsSeparator"
				defaultValue={`" - "`}
			/>
		</>
	);
};

import { AdjustLyricOffsetModal } from "./adjust-lyric-offset";
import { SelectLocalLyricModal } from "./select-local-lyric";
import { SelectMusicIdModal } from "./select-music-id";

export const ModalsWrapper: React.FC = () => {
	return (
		<>
			<SelectMusicIdModal />
			<SelectLocalLyricModal />
			<AdjustLyricOffsetModal />
		</>
	);
};

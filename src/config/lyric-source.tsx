import { GroupBox } from "../components/appkit/group-box";

export const LyricSourceSettings: React.FC = () => {
	return (
		<>
			<GroupBox>
				你可以在此处添加歌词来源，如果网易云没有歌词可用时将会依次尝试此处的歌词来源获取歌词。
			</GroupBox>
		</>
	);
};

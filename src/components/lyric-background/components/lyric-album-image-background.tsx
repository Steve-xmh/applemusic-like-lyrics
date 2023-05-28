import { useAtomValue } from "jotai";
import { musicIdAtom } from "../../../core/states";
import * as React from "react";
import { useAlbumImage } from "../../../api/react";
import { warn } from "../../../utils/logger";

export const LyricAlbumImageBackground: React.FC = () => {
	const musicId = useAtomValue(musicIdAtom);
	const [albumImageLoaded, albumImage, albumImageUrl] = useAlbumImage(musicId);
	const [currentBG, setCurrentBG] = React.useState("");

	React.useEffect(() => {
		let canceled = false;
		(async () => {
			try {
				if (albumImageLoaded && albumImage) {
					try {
						await albumImage.decode();
					} catch (err) {
						warn("图片解码失败，将直接设置", err);
					}
					setCurrentBG(albumImageUrl);
				}
			} catch (err) {
				warn("更新专辑图片到背景时发生错误", err);
			}
		})();
		return () => {
			canceled = true;
		};
	}, [albumImageLoaded, albumImage, albumImageUrl]);
	return (
		<div
			className="am-lyric-background am-lyric-bg-album-image"
			style={{
				position: "fixed",
				left: "0",
				top: "0",
				width: "100%",
				height: "100%",
				color: "yellow",
				backgroundImage: `url(${currentBG})`,
				backgroundPosition: "center",
				backgroundSize: "cover",
			}}
		/>
	);
};

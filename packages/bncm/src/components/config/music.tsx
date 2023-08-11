import React, { FC } from "react";
import { GroupBox, GroupBoxDevider } from "../appkit/group-box";
import { atomWithConfig } from "./atom-with-config";
import { SwitchConfigComponent } from "./common";
import { PlayControlButtonType } from "../song-info/play-control-button";

export const showAudioQualityTagAtom = atomWithConfig({
	key: "show-audio-quality-tag",
	default: true,
	desc: "是否显示音质标签",
});

export const showAlbumImageAtom = atomWithConfig({
	key: "show-album-image",
	default: true,
	desc: "显示专辑图片",
});

export const showMusicNameAtom = atomWithConfig({
	key: "show-music-name",
	default: true,
	desc: "显示歌曲名称",
});

export const showAlbumNameAtom = atomWithConfig({
	key: "show-album-name",
	default: false,
	desc: "显示专辑名称",
});

export const showMusicArtistsAtom = atomWithConfig({
	key: "show-music-artists",
	default: true,
	desc: "显示歌手名称",
});

export const showMenuButtonAtom = atomWithConfig({
	key: "show-menu-button",
	default: true,
	desc: "显示菜单按钮",
});

export const showControlThumbAtom = atomWithConfig({
	key: "show-control-thumb",
	default: true,
	desc: "显示控制横条",
});

export const leftControlButtonTypeAtom = atomWithConfig({
	key: "left-control-button-type",
	default: PlayControlButtonType.PlaybackRandom,
	desc: "当使用播放控制栏时，左侧的按钮操作类型",
});

export const rightControlButtonTypeAtom = atomWithConfig({
	key: "right-control-button-type",
	default: PlayControlButtonType.PlaybackRepeat,
	desc: "当使用播放控制栏时，右侧的按钮操作类型",
});

export const LyricStyleConfig: FC = () => {
	return (
		<>
			<GroupBox>
				<SwitchConfigComponent
					atom={showAudioQualityTagAtom}
					label="显示音质标签"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent atom={showAlbumImageAtom} label="显示专辑图片" />
				<GroupBoxDevider />
				<SwitchConfigComponent atom={showMusicNameAtom} label="显示音乐名称" />
				<GroupBoxDevider />
				<SwitchConfigComponent atom={showAlbumNameAtom} label="显示专辑名称" />
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={showMusicArtistsAtom}
					label="显示歌手名称"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={showMenuButtonAtom}
					label="显示菜单按钮"
					description="隐藏后，你依然可以通过右键左侧任意位置打开菜单"
				/>
				<GroupBoxDevider />
				<SwitchConfigComponent
					atom={showControlThumbAtom}
					label="显示控制横条"
					description="隐藏后，你依然可以通过菜单来关闭歌词页面"
				/>
			</GroupBox>
		</>
	);
};

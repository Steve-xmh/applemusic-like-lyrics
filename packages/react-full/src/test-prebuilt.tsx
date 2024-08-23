import {
	type FC,
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { createRoot } from "react-dom/client";
import { PrebuiltLyricPlayer } from "./components/PrebuiltLyricPlayer";
import { Provider, useStore } from "jotai";
import {
	hideVerticalLyricViewAtom,
	musicAlbumNameAtom,
	musicArtistsAtom,
	musicCoverAtom,
	musicLyricLinesAtom,
	musicNameAtom,
} from "./states/music";
import { ContextMenu, Theme } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";
import { onRequestOpenMenuAtom } from "./states/callback";

const App: FC = () => {
	const [hideLyric, setHideLyric] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);
	const store = useStore();

	useEffect(() => {
		store.set(musicLyricLinesAtom, [
			{
				words: [
					{
						word: "Test",
						startTime: 0,
						endTime: 1000,
					},
				],
				startTime: 0,
				endTime: 1000,
				translatedLyric: "",
				romanLyric: "",
				isBG: false,
				isDuet: false,
			},
		]);
	}, [store]);

	useEffect(() => {
		store.set(hideVerticalLyricViewAtom, hideLyric);
	}, [hideLyric, store]);

	const onRequestOpenMenu = useCallback(() => {
		const inputEl = document.createElement("input");
		inputEl.type = "file";
		inputEl.accept = "audio/*";
		inputEl.onchange = (e) => {
			const files = (e.target as HTMLInputElement).files;
			if (!files) return;
			const file = files[0];
			jsmediatags.read(file, {
				onSuccess(tag) {
					console.log("tag read", tag);
					const title: string = tag.tags?.title ?? file.name ?? "未知歌曲";
					const album: string = tag.tags?.album ?? "未知专辑";
					const artist: string = tag.tags?.artist ?? "未知作者";
					const lyrics: string = tag.tags?.lyrics ?? "";
					store.set(musicNameAtom, title);
					store.set(musicAlbumNameAtom, album);
					store.set(musicArtistsAtom, [{ name: artist, id: "unknown" }]);
					if ("picture" in tag.tags) {
						const { data, format }: { data: Uint8Array; format: string } =
							tag.tags.picture;
						let base64String = "";
						for (let i = 0; i < data.length; i++) {
							base64String += String.fromCharCode(data[i]);
						}
						const imgUrl = `data:${format};base64,${window.btoa(base64String)}`;
						store.set(musicCoverAtom, imgUrl);
					}
				},
				onError(error) {
					console.log(error);
				},
			});
		};
		inputEl.click();
	}, [store]);

	useLayoutEffect(() => {}, []);

	useLayoutEffect(() => {
		store.set(onRequestOpenMenuAtom, {
			onEmit: onRequestOpenMenu,
		});
	}, [store, onRequestOpenMenu]);

	return (
		<>
			{/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
			<audio ref={audioRef} />

			<ContextMenu.Root>
				<ContextMenu.Trigger>
					<PrebuiltLyricPlayer
						style={{
							position: "fixed",
							width: "100%",
							maxWidth: "100vw",
							overflow: "hidden",
							height: "100vh",
							backgroundColor: "#222",
						}}
					/>
				</ContextMenu.Trigger>
				<ContextMenu.Content size="1">
					<ContextMenu.Label>AMLL React 框架示例</ContextMenu.Label>
					<ContextMenu.Item onSelect={onRequestOpenMenu}>
						打开音乐文件
					</ContextMenu.Item>
					<ContextMenu.CheckboxItem
						checked={!hideLyric}
						onCheckedChange={(e) => setHideLyric(!e)}
					>
						显示歌词
					</ContextMenu.CheckboxItem>
					<ContextMenu.Sub>
						<ContextMenu.SubTrigger>设置歌词</ContextMenu.SubTrigger>
						<ContextMenu.SubContent>
							<ContextMenu.Item>空歌词</ContextMenu.Item>
							<ContextMenu.Separator />
							<ContextMenu.Item>TTML 歌词</ContextMenu.Item>
							<ContextMenu.Item>Lyricify Syllable 歌词</ContextMenu.Item>
							<ContextMenu.Separator />
							<ContextMenu.Item>LyRiC 歌词</ContextMenu.Item>
							<ContextMenu.Item>YRC 歌词</ContextMenu.Item>
							<ContextMenu.Item>QRC 歌词</ContextMenu.Item>
						</ContextMenu.SubContent>
					</ContextMenu.Sub>
				</ContextMenu.Content>
			</ContextMenu.Root>
		</>
	);
};

createRoot(document.getElementById("root") as HTMLElement).render(
	<Provider>
		<Theme appearance="dark">
			<App />
		</Theme>
	</Provider>,
);

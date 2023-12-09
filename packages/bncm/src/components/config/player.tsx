import { FC } from "react";
import { GroupBox, GroupBoxDevider } from "../appkit/group-box";
import { Switch } from "../appkit/switch/switch";
import { TextField } from "../appkit/text-field";
import { Button } from "../appkit/button";
import { useAtom, useAtomValue } from "jotai";
import { wsConnectionStatusAtom } from "../../music-context/ws-states";
import { Spinner } from "../appkit/spinner/spinner";
import { enableWSPlayer, wsPlayerURL } from "./atoms";

export const PlayerConfig: FC = () => {
	const wsStatus = useAtomValue(wsConnectionStatusAtom);
	const [enabled, setEnabled] = useAtom(enableWSPlayer);
	const [url, setUrl] = useAtom(wsPlayerURL);
	return (
		<>
			<GroupBox
				style={{ display: "flex", flexDirection: "column", gap: "8px" }}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
					}}
				>
					<div
						style={{
							flex: "1",
						}}
					>
						<div
							style={{
								fontSize: "14px",
							}}
						>
							歌词播放器
						</div>
						<div
							style={{
								display: "flex",
								alignItems: "center",
								gap: "8px",
							}}
						>
							<div
								style={{
									width: "6px",
									height: "6px",
									backgroundColor: wsStatus.color,
									borderRadius: "100%",
								}}
							/>
							<div
								style={{
									opacity: "0.75",
								}}
							>
								{wsStatus.text}
							</div>
						</div>
					</div>
					<div>{wsStatus.progress && <Spinner />}</div>
					<div>
						<Switch selected={!!enabled} onClick={() => setEnabled(!enabled)} />
					</div>
				</div>
				<GroupBoxDevider />
				<div
					style={{
						display: "flex",
						gap: "8px",
					}}
				>
					<TextField
						type="text"
						placeholder="歌词播放器连接地址"
						style={{ flex: "1", minWidth: "0" }}
						value={url ?? ""}
						onInput={async (event) => {
							await setUrl(event.currentTarget.value);
						}}
					/>
					<Button>重新连接</Button>
				</div>
			</GroupBox>
			<GroupBox
				id="amll-reason"
				style={{ display: "flex", flexDirection: "column", gap: "8px" }}
			>
				<div>这个是什么？</div>
				<div>
					歌词播放器相当于外挂字幕一样的软件，在独立于网易云以外的环境播放歌词。
					<p />
					经过作者的性能测试，发现在网易云内嵌入播放页面会因为网易云自身浏览器框架问题导致掉帧和不定卡顿的问题。
					<p />
					故作者决定将播放页面分离到一个独立的桌面程序进行以提高播放性能和效果，而本插件则负责将播放的信息和状态传递给歌词播放器。
					<p />
					因此如果你也有少许卡顿现象，可以尝试安装一个 Apple Music-like Lyric
					歌词播放器，性能应该可以有所改善。
					<p />
					<del>毕竟真的不是我插件优化差啊（）</del>
				</div>
				<div
					style={{
						alignSelf: "flex-end",
						display: "flex",
						flexDirection: "row",
						gap: "8px",
					}}
				>
					<Button
						onClick={() => {
							betterncm.ncm.openUrl(
								"https://github.com/Steve-xmh/applemusic-like-lyrics/actions/workflows/build-player.yaml",
							);
						}}
						accent
					>
						前往下载 AMLL Player
					</Button>
				</div>
			</GroupBox>
		</>
	);
};

import { driver } from "driver.js";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { FC, useEffect, useRef } from "react";
import {
	neverGonnaGiveYouUpAtom,
	showTutoialAtom,
} from "../components/config/atoms";
import "./guide.sass";
import { closeLyricPage, openLyricPage } from "../injector";
import { loadable } from "jotai/utils";

const neverGonnaGiveYouUpLoadableAtom = loadable(neverGonnaGiveYouUpAtom);
const showTutoialLoadabltAtom = loadable(showTutoialAtom);

export const AMLLGuide: FC = () => {
	const neverGonnaGiveYouUp = useAtomValue(neverGonnaGiveYouUpLoadableAtom);
	const showTutoial = useAtomValue(showTutoialLoadabltAtom);
	const setShowTutoial = useSetAtom(showTutoialAtom);
	const displayed = useRef(false);

	useEffect(() => {
		if (
			showTutoial.state !== "hasData" ||
			neverGonnaGiveYouUp.state !== "hasData" ||
			displayed.current
		)
			return;
		const driverObj = driver({
			allowClose: false,
			allowKeyboardControl: false,
			disableActiveInteraction: true,
			nextBtnText: "下一步",
			prevBtnText: "上一步",
			doneBtnText: "完成",
			showButtons: ["next"],
			disableButtons: ["previous"],
			steps: [
				{
					popover: {
						title: "开发版本警告",
						description: [
							"此为 Apple Music-like Lyrics 的 3.0.0 开发（Dev）版本",
							"一切开发中的功能均有可能随时改变或无法工作或原地爆炸",
							"故在进入测试（Beta）阶段前暂不接受任何形式的 BUG 提交！",
						].join("\n"),
						onNextClick: () => {
							if (showTutoial.data) {
								driverObj.moveNext();
							} else {
								driverObj.destroy();
							}
						},
					},
				},
				{
					popover: {
						title: "欢迎！",
						description: [
							"使用 Apple Music-like Lyrics 插件！",
							"接下来是一个简短的使用流程！",
						].join("\n"),
					},
				},
				{
					element: "#x-g-mn .m-pinfo .j-flag .cover",
					popover: {
						title: "进入歌词页面",
						description: [
							"你的歌词页面现在已经焕然一新了！",
							"点击此处即可进入！",
						].join("\n"),
						onNextClick: () => {
							openLyricPage();
							setTimeout(driverObj.moveNext, 750);
						},
					},
				},
				{
					element: "#amll-view .am-music-main-menu",
					popover: {
						title: "页面内菜单",
						description: [
							"点击菜单按钮（或者右键任意位置）",
							"就可以和这个歌曲有关的各种操作交互了！",
						].join("\n"),
						onNextClick: () => {
							openLyricPage();
							driverObj.moveNext();
						},
					},
				},
				{
					element: "#amll-view .amll-control-thumb",
					popover: {
						title: "退出歌词页面",
						description: ["点击专辑图片上方的横条即可退出歌词页面哦！"].join(
							"\n",
						),
						onNextClick: () => {
							closeLyricPage();
							driverObj.moveNext();
						},
					},
				},
				{
					popover: {
						title: "更多设置",
						description: [
							"如果需要调整各种设置",
							"例如页面样式、歌词文件、歌词源",
							"都可以在插件设置中调节哦！",
						].join("\n"),
					},
				},
				{
					popover: {
						title: "结束啦！",
						description: [
							"那么以上就是大概的使用流程！",
							"希望你能用的开心！",
							"如果还有什么不会的话",
							"可以在插件设置里再次显示本教程哦！",
						].join("\n"),
						onNextClick: () => {
							driverObj.moveNext();
							setShowTutoial(false);
						},
					},
				},
			],
		});
		if (showTutoial.data) {
			if (neverGonnaGiveYouUp.data) {
				driverObj.drive();
			} else {
				driverObj.drive(1);
			}
		} else {
			if (!neverGonnaGiveYouUp.data) {
				driverObj.drive();
			}
		}
		displayed.current = true;
	}, [neverGonnaGiveYouUp, showTutoial]);

	return <></>;
};

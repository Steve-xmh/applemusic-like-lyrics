import { driver } from "driver.js";
import { useAtom, useAtomValue } from "jotai";
import { FC, useEffect, useRef } from "react";
import {
	autoOpenLyricPageAtom,
	showTutoialAtom,
} from "../../components/config/atoms";
import "./guide.sass";
import { closeLyricPage, openLyricPage } from "../../injector";

export const AMLLGuide: FC = () => {
	const [showTutoial, setShowTutoial] = useAtom(showTutoialAtom);
	const autoOpenLyricPage = useAtomValue(autoOpenLyricPageAtom);
	const displayed = useRef(false);

	useEffect(() => {
		if (autoOpenLyricPage.state === "hasData" && autoOpenLyricPage.data) {
			openLyricPage();
		}
	}, [autoOpenLyricPage]);

	useEffect(() => {
		if (showTutoial.state !== "hasData" || displayed.current) return;
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
						title: "欢迎！",
						description: [
							"欢迎使用 Apple Music-like Lyrics 插件！",
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
							setTimeout(driverObj.moveNext, 750);
						},
					},
				},
				{
					element: "#x-g-mn .m-pinfo .j-flag .cover",
					popover: {
						title: "需要回到原来的歌词页面？",
						description: [
							"只需要按住 Shift 键再点击此处即可回到默认歌词页面！",
							"如果你还安装了其他歌词插件，则会按照其他歌词插件的方式打开其他歌词页面噢！",
						].join("\n"),
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
			driverObj.drive();
		}
		displayed.current = true;
	}, [showTutoial]);

	return null;
};

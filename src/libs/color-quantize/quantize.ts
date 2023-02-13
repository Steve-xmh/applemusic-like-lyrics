/**
 * Basic Javascript port of the MMCQ (modified median cut quantization)
 * algorithm from the Leptonica library (http://www.leptonica.org/).
 * Returns a color map you can use to map original pixels to the reduced
 * palette. Still a work in progress.
 */

import { CMap } from "./c-map";
import { PQueue } from "./p-queue";
import {
	fractByPopulations,
	getHistoAndVBox,
	maxIterations,
	medianCutApply,
	Pixel,
	pv,
} from "./utils";
import { VBox } from "./v-box";

export const quantize = (pixels: Pixel[], maxcolors: number) => {
	if (!pixels.length || maxcolors < 1 || maxcolors > 256) {
		return new CMap();
	}

	// 将 RGB 三维色彩数组 转为 histo 一维数组（会做一定压缩处理）
	// 根据原 rgb 像素数组获取色彩空间 vbox（r, g, b三色的范围）
	const { histo, vbox } = getHistoAndVBox(pixels);

	// vbox 优先队列，以属于该 vbox 的像素数量 count 排序
	const pq = new PQueue<VBox>((a, b) => {
		return pv.naturalOrder(a.count(), b.count());
	});
	pq.push(vbox);

	// 将 vbox 队列扩展到 target 目标长度
	// 因为是优先队列，所以每一次都拆分 pop 的第一个（即像素数最多的一个）vbox
	const iter = (vboxQueue: PQueue<VBox>, target: number) => {
		let vboxSize = vboxQueue.size();
		let tempIterations = 0;
		let vbox: VBox;

		while (tempIterations < maxIterations) {
			// 满足数量需求
			if (vboxSize >= target) return;
			// 遍历次数过多
			if (tempIterations++ > maxIterations) return;
			// 队列顶部 vbox 无像素
			if (!vboxQueue.peek().count()) return;

			vbox = vboxQueue.pop();
			// do the cut
			const [vbox1, vbox2] = medianCutApply(histo, vbox);

			if (!vbox1) {
				// log("vbox1 not defined; shouldn't happen!");
				return;
			}
			vboxQueue.push(vbox1);
			if (vbox2) {
				/* vbox2 can be null */
				vboxQueue.push(vbox2);
				vboxSize++;
			}
		}
	};

	// 第一次分割 vboxes ，按照（像素量）进行粗分
	iter(pq, fractByPopulations * maxcolors);

	// 按(像素量 * 色彩空间体积)重新排序
	pq.sort((a, b) => {
		return pv.naturalOrder(a.count() * a.volume(), b.count() * b.volume());
	});

	// 第二次分割，使用 (像素量 * 色彩空间体积) 排序生成中位数切割.
	iter(pq, maxcolors);

	// 遍历 pq，更新 vbox 中 avg color
	const cmap = new CMap();
	while (pq.size()) {
		cmap.push(pq.pop());
	}

	return cmap;
};

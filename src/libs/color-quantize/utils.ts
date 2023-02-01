import { VBox, VBoxRangeKey } from "./v-box";

export type Pixel = [number, number, number]; // [red ,green, blue] 像素数组
export type Histo = number[]; // 记录像素数量数组（下标根据 rgb 数值运算得）

export const sigbits = 5;
export const rshift = 8 - sigbits;
export const maxIterations = 1000;
export const fractByPopulations = 0.75;

export const pv = {
	naturalOrder: <T>(a: T, b: T) => {
		return a < b ? -1 : a > b ? 1 : 0;
	},
	sum: <T>(array: T[], f?: (t: T) => number) => {
		return array.reduce((p, t) => {
			return p + (f ? f.call(array, t) : Number(t));
		}, 0);
	},
	max: <T>(array: T[], f?: (d: T) => number) => {
		return Math.max.apply(null, f ? array.map(f) : array.map((d) => Number(d)));
	},
	size: <T>(array: T[]) => {
		return array.reduce((p, t) => (t ? p + 1 : p), 0);
	},
};

/**
 * 获取[reg, green, blue]颜色空间像素对应的 histo 下标
 * histo[00000 00000 00000]
 * @returns index
 */
export const getColorIndex = (r: number, g: number, b: number) => {
	return (r << (2 * sigbits)) + (g << sigbits) + b;
};

/**
 * 通过数组 [reg, green, blue] 获取该像素在 histo 下标
 * histo每个元素保存 对应颜色空间像素 的数量
 * @param pixels
 * @returns histo
 */
export const getHisto = (pixels: Pixel[]): Histo => {
	let histo = new Array<number>(1 << (3 * sigbits));
	let index: number;
	let rval: number;
	let gval: number;
	let bval: number;
	pixels.forEach((pixel) => {
		[rval, gval, bval] = pixel.map((num) => num >> rshift);
		index = getColorIndex(rval, gval, bval); // 获取该颜色空间像素对应的 histo 下标
		histo[index] = (histo[index] || 0) + 1;
	});
	return histo;
};

/**
 * 根据像素信息 [reg, green, blue][] 分别获取 rgb 的最值，以及该像素数量
 * @param pixels
 * @returns
 * {
 *  histo: 一维数组，给出颜色空间每个量化区域的像素数
 *  vbox: 色彩空间体
 * }
 */
export const getHistoAndVBox = (pixels: Pixel[]) => {
	// 一维色彩范围数组
	let histo = new Array<number>(1 << (3 * sigbits));
	let index: number;
	// 色彩空间范围
	let rmin = Infinity;
	let rmax = 0;
	let gmin = Infinity;
	let gmax = 0;
	let bmin = Infinity;
	let bmax = 0;
	// r,g,b压缩值
	let rval: number;
	let gval: number;
	let bval: number;
	// 更新 histo && find min/max, 根据最值生成符合该色彩空间的 vbox
	pixels.forEach(function (pixel) {
		[rval, gval, bval] = pixel.map((num) => num >> rshift);

		index = getColorIndex(rval, gval, bval); // 获取该颜色空间像素对应的 histo 下标
		histo[index] = (histo[index] || 0) + 1;

		if (rval < rmin) rmin = rval;
		else if (rval > rmax) rmax = rval;
		if (gval < gmin) gmin = gval;
		else if (gval > gmax) gmax = gval;
		if (bval < bmin) bmin = bval;
		else if (bval > bmax) bmax = bval;
	});
	return {
		vbox: new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo),
		histo,
	};
};

/**
 * 根据最长边切分色彩空间长方体 vbox
 * 1. 找到 vbox 最长边 l
 * 2. 找到 l 边上中位数下标
 * 3. 根据中位数切分空间密度较大的 vbox
 * @param histo
 * @param vbox
 * @returns
 */
export const medianCutApply = (histo: Histo, vbox: VBox): VBox[] => {
	// no pixel, return
	if (!vbox.count()) return [];
	// only one pixel, no split
	if (vbox.count() === 1) {
		return [vbox.copy()];
	}

	const rw = vbox.r2 - vbox.r1 + 1;
	const gw = vbox.g2 - vbox.g1 + 1;
	const bw = vbox.b2 - vbox.b1 + 1;
	const maxw = pv.max([rw, gw, bw]);
	const partialsum: number[] = [];

	let total = 0;
	let i: number;
	let j: number;
	let k: number;
	let sum: number;
	let index: number;

	// 根据三色轴获取该轴像素数量
	if (maxw === rw) {
		for (i = vbox.r1; i <= vbox.r2; i++) {
			sum = 0;
			for (j = vbox.g1; j <= vbox.g2; j++) {
				for (k = vbox.b1; k <= vbox.b2; k++) {
					index = getColorIndex(i, j, k);
					sum += histo[index] || 0;
				}
			}
			total += sum;
			partialsum[i] = total;
		}
	} else if (maxw === gw) {
		for (i = vbox.g1; i <= vbox.g2; i++) {
			sum = 0;
			for (j = vbox.r1; j <= vbox.r2; j++) {
				for (k = vbox.b1; k <= vbox.b2; k++) {
					index = getColorIndex(j, i, k);
					sum += histo[index] || 0;
				}
			}
			total += sum;
			partialsum[i] = total;
		}
	} else {
		for (i = vbox.b1; i <= vbox.b2; i++) {
			sum = 0;
			for (j = vbox.r1; j <= vbox.r2; j++) {
				for (k = vbox.g1; k <= vbox.g2; k++) {
					index = getColorIndex(j, k, i);
					sum += histo[index] || 0;
				}
			}
			total += sum;
			partialsum[i] = total;
		}
	}

	/**
	 * 根据颜色维度获取中位数，并切分vbox
	 * @param color 颜色维度
	 * @returns
	 */
	const doCut = (color: "r" | "g" | "b") => {
		const dim1 = `${color}1` as VBoxRangeKey;
		const dim2 = `${color}2` as VBoxRangeKey;
		let left: number;
		let right: number;
		let vbox1: VBox;
		let vbox2: VBox;
		let cutIndex: number;

		for (i = vbox[dim1]; i <= vbox[dim2]; i++) {
			if (partialsum[i] >= total / 2) {
				break;
			}
		}

		vbox1 = vbox.copy();
		vbox2 = vbox.copy();
		// 中位数下标与该轴上下限下标的距离，距离越短即空间密度越大
		left = i - vbox[dim1];
		right = vbox[dim2] - i;
		// 获取切分点
		cutIndex =
			left <= right
				? Math.min(vbox[dim2] - 1, ~~(i + right / 2))
				: Math.max(vbox[dim1], ~~(i - 1 - left / 2));
		// avoid 0-count boxes
		while (!partialsum[cutIndex] && cutIndex <= vbox[dim2]) cutIndex++;
		// set dimensions
		vbox1[dim2] = cutIndex;
		vbox2[dim1] = cutIndex + 1;

		return [vbox1, vbox2];
	};

	// determine the cut planes
	return maxw === rw ? doCut("r") : maxw === gw ? doCut("g") : doCut("b");
};

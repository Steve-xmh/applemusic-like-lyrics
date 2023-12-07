/**
 *  修改自 https://github.com/woshizja/sound-processor
 */

/**
 * A计权
 * @param {number} f
 * return weighting
 */
function aWeighting(f: number) {
	const f2 = f * f;
	return (
		(1.2588966 * 148840000 * f2 * f2) /
		((f2 + 424.36) *
			Math.sqrt((f2 + 11599.29) * (f2 + 544496.41)) *
			(f2 + 148840000))
	);
}

/**
 * 高斯公式
 */
function gauss(x: number, sigma = 1, mu = 0) {
	return Math.pow(Math.E, -(Math.pow(x - mu, 2) / (2 * sigma * sigma)));
}

type AudioData = number[] | Uint8Array;

export interface SoundProcessorOption {
	filterParams?: {
		sigma?: number;
		radius?: number;
	};
	sampleRate: number;
	fftSize: number;
	endFrequency?: number;
	startFrequency?: number;
	outBandsQty: number;
	tWeight?: boolean;
	aWeight?: boolean;
}

export class SoundProcessor {
	sampleRate: number;
	fftSize: number;
	bandsQty: number;
	outBandsQty: number;
	bandwidth: number;
	startFrequency: number;
	endFrequency: number;
	tWeight: boolean;
	aWeight: boolean;
	filterParams: {
		mu: number; // 固定为0
		sigma: number;
		filterRadius: number;
	} = {
		mu: 0,
		sigma: 1,
		filterRadius: 2,
	};
	aWeights: number[];
	bands: {
		lowerFrequency: number;
		upperFrequency: number;
	}[];
	gKernel: number[];
	historyLimit: number;
	history: AudioData[];
	gKernelSum = 0;
	filterRadius = 0;
	constructor(options: SoundProcessorOption) {
		const {
			filterParams,
			sampleRate,
			fftSize,
			endFrequency,
			startFrequency,
			outBandsQty,
			tWeight,
			aWeight,
		} = options;

		if (!fftSize || !sampleRate || !outBandsQty) {
			throw new Error("need fftSize, sampleRate and outBandsQty");
		}

		this.sampleRate = sampleRate; // 采样率
		this.fftSize = fftSize || 1024; // fftSize
		this.bandsQty = Math.floor(fftSize / 2); // 频带数
		this.outBandsQty = outBandsQty; // 输出的频带数
		this.bandwidth = sampleRate / fftSize; // 带宽
		this.startFrequency = startFrequency || 0;
		this.endFrequency = endFrequency || 10000;
		this.tWeight = !!tWeight;
		this.aWeight = aWeight === undefined ? true : !!aWeight;

		if (filterParams) {
			// 默认标准正态分布: N(0, 1)
			this.filterParams = {
				mu: 0, // 固定为0
				sigma: filterParams.sigma || 1,
				filterRadius:
					filterParams.radius === undefined
						? 2
						: Math.floor(filterParams.radius),
			};
		}

		this.aWeights = [];
		this.bands = [];
		this.gKernel = [];

		this.historyLimit = 5;
		this.history = [];

		this.initWeights();
		this.initBands();
		this.initGaussKernel();

		this.process = this.process.bind(this);
	}

	private initWeights() {
		const { bandwidth, bandsQty, aWeights } = this;

		for (let i = 0; i < bandsQty; i++) {
			aWeights.push(aWeighting(i * bandwidth));
		}
	}

	private initBands() {
		const { endFrequency, startFrequency, outBandsQty, bands } = this;

		// 根据起止频谱、频带数量确定倍频数: N
		// fu = 2^(1/N)*fl  => n = 1/N = log2(fu/fl) / bandsQty
		let n = Math.log2(endFrequency / (startFrequency || 1)) / outBandsQty;
		n = Math.pow(2, n); // n = 2^(1/N)

		const nextBand = {
			lowerFrequency: Math.max(startFrequency, 0),
			upperFrequency: 0,
		};

		for (let i = 0; i < outBandsQty; i++) {
			// 频带的上频点是下频点的2^n倍
			const upperFrequency = nextBand.lowerFrequency * n;
			nextBand.upperFrequency = Math.min(upperFrequency, endFrequency);

			bands.push({
				lowerFrequency: nextBand.lowerFrequency,
				upperFrequency: nextBand.upperFrequency,
			});
			nextBand.lowerFrequency = upperFrequency;
		}
	}

	private initGaussKernel() {
		const { filterParams, gKernel } = this;

		const { mu, sigma, filterRadius } = filterParams;

		const radius = filterRadius;

		for (let i = -radius; i < 1; i++) {
			// step=1
			gKernel.push(gauss(i, sigma, mu));
		}

		for (let i = radius - 1; i > -1; i--) {
			// 对称
			gKernel.push(gKernel[i]);
		}

		this.gKernelSum = gKernel.reduce((prev, curr) => {
			return prev + curr;
		});
		this.filterRadius = filterRadius;

		console.log(gKernel);
	}

	private filter(frequencies: AudioData) {
		const { gKernel, gKernelSum, filterRadius } = this;

		if (!filterRadius) return;

		// 滤波
		for (let i = 0; i < frequencies.length; i++) {
			let count = 0;
			for (let j = i - filterRadius; j < i + filterRadius; j++) {
				const value = frequencies[j] !== undefined ? frequencies[j] : 0;
				count += value * gKernel[j - i + filterRadius];
			}

			frequencies[i] = count / gKernelSum;
		}
	}

	aWeighting(frequencies: AudioData) {
		const { aWeights } = this;

		for (let i = 0; i < frequencies.length; i++) {
			if (aWeights[i] !== undefined) {
				frequencies[i] = frequencies[i] * aWeights[i];
			}
		}
	}

	divide(frequencies: AudioData): number[] {
		const { outBandsQty, bandwidth, bands } = this;
		const temp = new Array(outBandsQty);

		for (let i = 0; i < bands.length; i++) {
			const band = bands[i];
			const startIndex = Math.floor(band.lowerFrequency / bandwidth);
			const endIndex = Math.min(
				Math.floor(band.upperFrequency / bandwidth),
				frequencies.length - 1,
			);

			let count = 0;
			// 均方值
			for (let i = startIndex; i <= endIndex; i++) {
				count += frequencies[i] * frequencies[i];
			}
			temp[i] = Math.sqrt(count / (endIndex + 1 - startIndex));
		}
		return temp;
	}

	private timeWeighting(frequencies: AudioData) {
		const { history, historyLimit } = this;

		if (history.length < 5) {
			history.push(frequencies.slice(0));
		} else {
			history.pop();
			history.unshift(frequencies.slice(0));
			for (let i = 0; i < frequencies.length; i++) {
				let count = 0;
				for (let j = 0; j < historyLimit; j++) {
					count += history[j][i] / historyLimit;
				}
				frequencies[i] = count;
			}
		}
	}

	process(frequencies: AudioData): number[] {
		// 1. filter
		if (this.filterParams) {
			this.filter(frequencies);
		}

		// 2. time weight
		if (this.tWeight) {
			this.timeWeighting(frequencies);
		}

		// 3. a weight
		if (this.aWeight) {
			this.aWeighting(frequencies);
		}

		// 4. spectrum divide
		return this.divide(frequencies);
	}
}

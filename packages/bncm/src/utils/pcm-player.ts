export interface inputCodecs {
	Int8: 128;
	Int16: 32768;
	Int32: 2147483648;
	Float32: 1;
}

interface TypedArrays {
	Int8: Int8Array;
	Int16: Int16Array;
	Int32: Int32Array;
	Float32: Float32Array;
}

interface TypedArrayConstructors {
	Int8: Int8ArrayConstructor;
	Int16: Int16ArrayConstructor;
	Int32: Int32ArrayConstructor;
	Float32: Float32ArrayConstructor;
}

export interface Options {
	inputCodec: keyof inputCodecs;
	channels: number;
	sampleRate: number;
	flushTime: number;
	onstatechange?: (
		node: AudioContext,
		event: Event,
		type: AudioContextState,
	) => {};
	onended?: (node: AudioBufferSourceNode, event: Event) => {};
}

type AnyArrayBuffer =
	| TypedArrays[keyof TypedArrays]
	| ArrayBufferView
	| ArrayBuffer;

export class PCMPlayer {
	private option: Options;
	private samples = new Float32Array(); // 样本存放区域
	private interval: ReturnType<typeof setInterval>;
	private convertValue = 0;
	private typedArray: TypedArrayConstructors[keyof TypedArrayConstructors];
	private audioCtx: AudioContext;
	private processNode: AudioNode;
	private analyzerNode: AnalyserNode;
	private startTime: number;
	constructor(option?: Partial<Options>) {
		const defaultOption: Options = {
			inputCodec: "Int16", // 传入的数据是采用多少位编码，默认16位
			channels: 1, // 声道数
			sampleRate: 8000, // 采样率 单位Hz
			flushTime: 1000, // 缓存时间 单位 ms
		};

		this.option = Object.assign({}, defaultOption, option); // 实例最终配置参数
		this.samples = new Float32Array();
		this.interval = setInterval(this.flush.bind(this), this.option.flushTime);
		this.convertValue = this.getConvertValue();
		this.typedArray = this.getTypedArray();

		// 初始化音频上下文的东西
		this.audioCtx = new AudioContext();
		this.analyzerNode = this.audioCtx.createAnalyser();
		this.analyzerNode.smoothingTimeConstant = 0.5;
		this.analyzerNode.minDecibels = -70;
		this.analyzerNode.maxDecibels = -20;

		this.processNode = this.analyzerNode;
		// const filter = this.audioCtx.createBiquadFilter();
		// filter.type = "lowshelf";
		// filter.frequency.value = 250;
		// filter.gain.value = -10;
		// filter.connect(this.analyzerNode);
		// this.processNode = filter;
		// 控制音量的 GainNode
		// https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/createGain
		// this.gainNode = this.audioCtx.createGain();
		// this.gainNode.gain.value = 0.1;
		// this.gainNode.connect(this.audioCtx.destination);
		this.startTime = this.audioCtx.currentTime;

		this.bindAudioContextEvent();
	}

	createFrequencyData() {
		const frequencyData = new Uint8Array(this.analyzerNode.frequencyBinCount);
		return frequencyData;
	}

	getByteFrequencyData(data: Uint8Array) {
		this.analyzerNode.getByteFrequencyData(data);
		return data;
	}

	private getConvertValue() {
		// 根据传入的目标编码位数
		// 选定转换数据所需要的基本值
		const inputCodecs = {
			Int8: 128,
			Int16: 32768,
			Int32: 2147483648,
			Float32: 1,
		};
		if (!inputCodecs[this.option.inputCodec])
			throw new Error(
				"wrong codec.please input one of these codecs:Int8,Int16,Int32,Float32",
			);
		return inputCodecs[this.option.inputCodec];
	}

	private getTypedArray() {
		// 根据传入的目标编码位数
		// 选定前端的所需要的保存的二进制数据格式
		// 完整TypedArray请看文档
		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
		const typedArrays = {
			Int8: Int8Array,
			Int16: Int16Array,
			Int32: Int32Array,
			Float32: Float32Array,
		};
		if (!typedArrays[this.option.inputCodec])
			throw new Error(
				"wrong codec.please input one of these codecs:Int8,Int16,Int32,Float32",
			);
		return typedArrays[this.option.inputCodec];
	}

	static isTypedArray(data: AnyArrayBuffer) {
		// 检测输入的数据是否为 TypedArray 类型或 ArrayBuffer 类型
		return (
			(data.byteLength &&
				"buffer" in data &&
				data.buffer.constructor === ArrayBuffer) ||
			data.constructor === ArrayBuffer
		);
	}

	private isSupported(data: AnyArrayBuffer) {
		// 数据类型是否支持
		// 目前支持 ArrayBuffer 或者 TypedArray
		if (!PCMPlayer.isTypedArray(data))
			throw new Error("请传入ArrayBuffer或者任意TypedArray");
		return true;
	}

	feed(data: AnyArrayBuffer) {
		this.isSupported(data);
		if (this.audioCtx.state === "suspended" || this.audioCtx.state === "closed")
			return;

		// 获取格式化后的buffer
		const fmtData = this.getFormattedValue(data);
		// 因为只用于音频可视化，所以我们将来不及处理或表现当前音频状况的数据丢弃
		// 将新的完整buff数据赋值给samples
		// interval定时器也会从samples里面播放数据
		this.samples = fmtData;
		// console.log('this.samples', this.samples)
	}

	private getFormattedValue(data: AnyArrayBuffer) {
		let typed: TypedArrays[keyof TypedArrays];
		if (data instanceof ArrayBuffer) {
			typed = new this.typedArray(
				"buffer" in data ? (data.buffer as ArrayBuffer) : data,
			);
		} else {
			throw new Error("请传入ArrayBuffer或者任意TypedArray");
		}

		const float32 = new Float32Array(typed.length);

		for (let i = 0; i < typed.length; i++) {
			// buffer 缓冲区的数据，需要是IEEE754 里32位的线性PCM，范围从-1到+1
			// 所以对数据进行除法
			// 除以对应的位数范围，得到-1到+1的数据
			// float32[i] = data[i] / 0x8000;
			float32[i] = typed[i] / this.convertValue;
		}
		return float32;
	}

	destroy() {
		if (this.interval) {
			clearInterval(this.interval);
		}
		(this.samples as unknown) = null;
		this.audioCtx.close();
		(this.audioCtx as unknown) = null;
	}

	flush() {
		if (!this.samples.length) return;
		if (this.audioCtx.state === "closed" || this.audioCtx.state === "suspended")
			return;
		const bufferSource = this.audioCtx.createBufferSource();
		if (typeof this.option.onended === "function") {
			const onended = this.option.onended;
			bufferSource.onended = function (event) {
				onended(this as AudioBufferSourceNode, event);
			};
		}
		const length = this.samples.length / this.option.channels;
		const audioBuffer = this.audioCtx.createBuffer(
			this.option.channels,
			length,
			this.option.sampleRate,
		);

		for (let channel = 0; channel < this.option.channels; channel++) {
			const audioData = audioBuffer.getChannelData(channel);
			let offset = channel;
			let decrement = 50;
			for (let i = 0; i < length; i++) {
				audioData[i] = this.samples[offset];
				/* fadein */
				if (i < 50) {
					audioData[i] = (audioData[i] * i) / 50;
				}
				/* fadeout*/
				if (i >= length - 51) {
					audioData[i] = (audioData[i] * decrement--) / 50;
				}
				offset += this.option.channels;
			}
		}

		if (this.startTime < this.audioCtx.currentTime) {
			this.startTime = this.audioCtx.currentTime;
		}
		// console.log('start vs current ' + this.startTime + ' vs ' + this.audioCtx.currentTime + ' duration: ' + audioBuffer.duration);
		bufferSource.buffer = audioBuffer;
		bufferSource.connect(this.processNode);
		bufferSource.start(this.startTime);
		this.startTime += audioBuffer.duration;
		this.samples = new Float32Array();
	}

	async pause() {
		await this.audioCtx.suspend();
	}

	async continue() {
		await this.audioCtx.resume();
	}

	private bindAudioContextEvent() {
		const self = this;
		if (typeof self.option.onstatechange === "function") {
			const onstatechange = self.option.onstatechange;
			this.audioCtx.onstatechange = function (event) {
				self.audioCtx &&
					onstatechange(this as AudioContext, event, self.audioCtx.state);
			};
		}
	}
}

export default PCMPlayer;

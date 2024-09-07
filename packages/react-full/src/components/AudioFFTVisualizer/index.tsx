import {
	type FC,
	type HTMLProps,
	useEffect,
	useLayoutEffect,
	useRef,
} from "react";

export const AudioFFTVisualizer: FC<
	{
		fftData: number[];
	} & HTMLProps<HTMLCanvasElement>
> = ({ fftData, ...props }) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const fftDataRef = useRef<number[]>();
	if (fftDataRef.current === undefined) {
		fftDataRef.current = fftData;
	}

	useEffect(() => {
		fftDataRef.current = fftData;
	}, [fftData]);

	useLayoutEffect(() => {
		const canvas = canvasRef.current;

		if (canvas) {
			const ctx = canvas.getContext("2d");
			if (ctx) {
				let targetSize = { width: 0, height: 0 };
				const obs = new ResizeObserver((sizes) => {
					for (const size of sizes) {
						targetSize = {
							width: size.contentRect.width * window.devicePixelRatio,
							height: size.contentRect.height * window.devicePixelRatio,
						};
					}
				});

				obs.observe(canvas);

				let maxValue = 100;
				let stopped = false;

				let buf: number[] = [];

				function onFrame() {
					if (!(canvas && ctx) || stopped) return;
					const width = canvas.width;
					const height = canvas.height;
					if (targetSize.width !== width || targetSize.height !== height) {
						canvas.width = targetSize.width;
						canvas.height = targetSize.height;
					}

					const processed = fftDataRef.current ?? [];
					if (buf.length !== processed.length) {
						buf = [...processed];
					} else {
						for (let i = 0; i < buf.length; i++) {
							let t = processed[i];
							t = t * Math.min(((i + 5) / buf.length) * 4, 1);
							buf[i] += t * 2;
							buf[i] /= 3;
						}
					}

					ctx.clearRect(0, 0, width, height);
					{
						ctx.beginPath();
						const targetMaxValue = Math.max.apply(Math, buf);
						maxValue = Math.max(targetMaxValue * 0.1 + maxValue * 0.9, 100);

						const len = buf.length;

						const barWidth = width / len;

						ctx.strokeStyle = "white";
						ctx.lineWidth = 4 * window.devicePixelRatio;
						ctx.lineCap = "round";
						ctx.lineJoin = "round";

						const barBeginY = height - barWidth;

						for (let i = 0; i < buf.length; i++) {
							const x = barWidth * (i + 0.5);
							ctx.moveTo(x, barBeginY);
							ctx.lineTo(
								x,
								barBeginY -
									Math.min(1, Math.max(0, buf[i] / maxValue)) ** 2 *
										(height - barWidth * 2),
							);
						}

						ctx.stroke();
					}

					requestAnimationFrame(onFrame);
				}

				onFrame();

				return () => {
					obs.disconnect();
					stopped = true;
				};
			}
		}
	}, []);

	return <canvas ref={canvasRef} {...props} />;
};

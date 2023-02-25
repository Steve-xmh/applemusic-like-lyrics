// 来自 https://github.com/audiojs/a-weighting/blob/master/d.js
// Dmitry Yvanov, MIT 开源协议

export function aWeighting(f: number) {
	var f2 = f * f;
	return (
		(1.2588966 * 148840000 * f2 * f2) /
		((f2 + 424.36) *
			Math.sqrt((f2 + 11599.29) * (f2 + 544496.41)) *
			(f2 + 148840000))
	);
}

export function bWeighting(f: number) {
	var f2 = f * f;
	return (
		(1.019764760044717 * 148840000 * f * f2) /
		((f2 + 424.36) * Math.sqrt(f2 + 25122.25) * (f2 + 148840000))
	);
}

export function cWeighting(f: number) {
	var f2 = f * f;
	return (
		(1.0069316688518042 * 148840000 * f2) / ((f2 + 424.36) * (f2 + 148840000))
	);
}

export function dWeighting(f: number) {
	var f2 = f * f;
	return (
		(f / 6.8966888496476e-5) *
		Math.sqrt(
			((1037918.48 - f2) * (1037918.48 - f2) + 1080768.16 * f2) /
				((9837328 - f2) * (9837328 - f2) + 11723776 * f2) /
				((f2 + 79919.29) * (f2 + 1345600)),
		)
	);
}

// WebGL1 port of Storyteller-Studios/Cirrus' IsolationEffect.
// The random values and flow parameters are re-rolled per album by
// IsolationRenderer, so a cover gets a stable composition while different
// covers do not share a layout.
//
// Everything that is constant for a whole draw call -- the sRGB to OkLab
// conversion of the four colors, and the randomised flow parameters -- is
// computed on the CPU and uploaded as uniforms instead of being recomputed per
// fragment.
//
// highp is required rather than optional: u_time grows without bound and the
// noise hash amplifies it by ~44000, which mediump's 10 significant bits cannot
// carry. IsolationRenderer.isSupported() refuses environments without highp
// fragment precision, so this shader simply fails to compile there instead of
// silently rendering a broken picture.
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
// The four gradient colors, already converted to OkLab by the CPU.
uniform vec3 u_colors[4];
uniform vec3 u_random;
// x = ripple frequency, y = ripple amplitude divisor,
// z = flow speed (sign carries the direction), w = gradient axis tilt in radians
uniform vec4 u_flowParams;
// Extra jitter added to the noise-driven gradient angle, in radians.
uniform float u_angleJitter;
uniform bool u_enableLightWave;
uniform bool u_enableDithering;
// 0 = write sRGB, 1 = write Display P3 (see bg-render/color-space.ts).
uniform int u_outputColorSpace;
// Saturation expansion applied on top of the P3 primaries, 0 disables it.
uniform float u_gamutExpand;

const float PI = 3.141592653589793;

vec2 rotatePoint(vec2 point, float angle) {
	float sine = sin(angle);
	float cosine = cos(angle);
	return vec2(
		point.x * cosine - point.y * sine,
		point.x * sine + point.y * cosine
	);
}

vec2 gradientHash(vec2 point) {
	return fract(
		sin(
			vec2(
				dot(point, vec2(127.1, 311.7)),
				dot(point, vec2(269.5, 183.3))
			)
		) * 43758.5453
	);
}

float gradientNoise(vec2 point) {
	vec2 cell = floor(point);
	vec2 offset = fract(point);
	vec2 eased = offset * offset * (3.0 - 2.0 * offset);
	float lower = mix(
		dot(-1.0 + 2.0 * gradientHash(cell), offset),
		dot(-1.0 + 2.0 * gradientHash(cell + vec2(1.0, 0.0)), offset - vec2(1.0, 0.0)),
		eased.x
	);
	float upper = mix(
		dot(-1.0 + 2.0 * gradientHash(cell + vec2(0.0, 1.0)), offset - vec2(0.0, 1.0)),
		dot(-1.0 + 2.0 * gradientHash(cell + vec2(1.0, 1.0)), offset - vec2(1.0, 1.0)),
		eased.x
	);
	return 0.5 + 0.5 * mix(lower, upper, eased.y);
}

float encodeTransfer(float channel) {
	return channel <= 0.0031308
		? 12.92 * channel
		: 1.055 * pow(max(channel, 0.0), 1.0 / 2.4) - 0.055;
}

// OkLab -> linear-light sRGB (D65).
vec3 okLabToLinearSrgb(vec3 color) {
	float lRoot = color.x + 0.3963377774 * color.y + 0.2158037573 * color.z;
	float mRoot = color.x - 0.1055613458 * color.y - 0.0638541728 * color.z;
	float sRoot = color.x - 0.0894841775 * color.y - 1.2914855480 * color.z;
	float l = lRoot * lRoot * lRoot;
	float m = mRoot * mRoot * mRoot;
	float s = sRoot * sRoot * sRoot;
	return vec3(
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
	);
}

// linear-light sRGB -> linear-light Display P3: same D65 white point, only the
// primaries differ, so a single 3x3 matrix is enough. Each component is the dot
// product with that row's column of the CSS Color 4 `lin_sRGB_to_lin_P3` matrix.
vec3 linearSrgbToLinearP3(vec3 color) {
	return vec3(
		dot(color, vec3(0.8224621724082974, 0.033194198850959854, 0.017082630775268638)),
		dot(color, vec3(0.1775378275917017, 0.9668058011490399, 0.07239743980023199)),
		dot(color, vec3(0.0, 0.0, 0.9105199294244997))
	);
}

// Encode a linear-light sRGB value into whatever the drawing buffer expects.
// sRGB and Display P3 share the same transfer function, so only the primaries
// have to be swapped; the encoding itself is identical.
vec3 encodeToOutput(vec3 linearSrgb) {
	vec3 linear = linearSrgb;
	if (u_outputColorSpace == 1) {
		linear = linearSrgbToLinearP3(linear);
		// 绕亮度扩张一次，把 P3 多出来的色域用掉；本来顶在 sRGB 边界上的颜色
		// 因此能再往外走一点，不至于白拿一圈空白色域
		float luma = dot(linear, vec3(0.2289745641, 0.6917385218, 0.0792869141));
		linear = clamp(mix(vec3(luma), linear, 1.0 + u_gamutExpand), 0.0, 1.0);
	}
	return vec3(
		encodeTransfer(linear.r),
		encodeTransfer(linear.g),
		encodeTransfer(linear.b)
	);
}

vec3 applyLightWave(vec3 okLabColor, vec2 uv) {
	vec2 point = -1.0 + 1.5 * uv;
	float x = point.x;
	float y = point.y;
	float time = u_time * 0.2;
	float yPhase = y / 0.3;
	float xPhase = x / 0.2;
	float timeWarp = cos(sin(time) * 2.0) * 0.1;
	float movement = (x + y) * 0.001 + timeWarp + sin(x * 0.01);
	float wave1 =
		sin(yPhase + 2.0 * time + u_random.x) * 0.5 -
		yPhase -
		xPhase * 0.5;
	float wave2 = cos(
		wave1 +
			sin(movement + time) +
			sin(y * 0.025 + time) +
			sin((x + y) * 0.01) * 3.0 +
			u_random.y
	);
	float wave3 = abs(
		sin(
			wave2 +
				cos(yPhase + time + xPhase + wave2) +
				cos(xPhase) +
				sin(x * 0.001) +
				u_random.z
		)
	);
	// 取色不再压暗，纯白封面的 L 能到 1.0，乘完必须钳住：让 L 溢出再靠末尾的
	// RGB 钳位收场会逐通道削顶，把色相也一起改掉
	okLabColor.x = clamp(okLabColor.x * (1.1 - 0.1 * wave3), 0.0, 1.0);
	// 返回 OkLab，编码交给 encodeToOutput()，好让 sRGB / P3 两条输出共用同一份
	// 颜色计算
	return okLabColor;
}

float interleavedGradientNoise(vec2 position) {
	return fract(
		52.9829189 * fract(dot(position, vec2(0.06711056, 0.00583715)))
	);
}

vec3 screenSpaceDither(vec2 screenPosition) {
	vec2 position = screenPosition + u_random.xy * 97.0;
	vec3 noise = vec3(
		interleavedGradientNoise(position),
		interleavedGradientNoise(position + vec2(17.0, 59.0)),
		interleavedGradientNoise(position + vec2(71.0, 23.0))
	);
	return (noise - 0.5) / 255.0;
}

void main() {
	vec2 uv = gl_FragCoord.xy / u_resolution;
	vec2 gradientPoint = uv - 0.5;
	float degree = gradientNoise(
		vec2(
			u_time * 0.1 + u_random.x * 0.07,
			gradientPoint.x * gradientPoint.y + u_random.y * 0.07
		)
	);
	float noiseAngle = ((degree - 0.5) * 720.0 + 180.0) * PI / 180.0;
	gradientPoint = rotatePoint(gradientPoint, noiseAngle + u_angleJitter);

	float frequency = u_flowParams.x;
	float amplitude = u_flowParams.y;
	float speed = u_time * u_flowParams.z;
	gradientPoint.x += sin(gradientPoint.y * frequency + speed) / amplitude;
	gradientPoint.y +=
		sin(gradientPoint.x * frequency * 1.5 + speed) / (amplitude * 0.5);

	float rotatedX = rotatePoint(gradientPoint, u_flowParams.w).x;
	float horizontal = smoothstep(-0.3, 0.2, rotatedX);
	vec3 okLabColor = mix(
		mix(u_colors[0], u_colors[1], horizontal),
		mix(u_colors[2], u_colors[3], horizontal),
		1.0 - smoothstep(-0.3, 0.5, gradientPoint.y)
	);
	vec3 color = encodeToOutput(
		okLabToLinearSrgb(
			u_enableLightWave ? applyLightWave(okLabColor, uv) : okLabColor
		)
	);

	if (u_enableDithering) {
		color += screenSpaceDither(gl_FragCoord.xy);
	}

	gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}

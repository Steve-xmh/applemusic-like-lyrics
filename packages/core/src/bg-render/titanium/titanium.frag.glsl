// Titanium 背景渲染器的着色器。
//
// 这是一个完全独立的程序化渲染器，不依赖网格渐变。它的光照按一张沙面来算：
//
// 1. 颜色来自封面提取的四个主题色（OkLab），按四角柔和混合成一片平滑的金属
//    渐变，再叠一层很慢的扭曲，颜色本身只在缓慢呼吸；
// 2. 画面是一张解析的高度场：一条圆顶的沙脊（脊线两侧一缓一陡）叠着几层很缓的
//    沙丘起伏。法线由高度场的梯度解析求出，明暗完全来自法线与光向的点积——
//    迎光面亮、背光面暗，亮面顺着沙丘的起伏还会有深浅变化，不是一块平涂；
// 3. 明暗交界处靠粉末的疏密过渡，脊线本身是一条光滑的解析曲线；
// 4. 每粒沙在沙面法线上再叠一点随机倾斜，只有恰好把光反射进镜头的才会亮：
//    闪点由光照驱动，所以亮处的沙面才闪，阴影里只余零星浮尘；
// 5. 每粒沙的随机量由格子坐标哈希出来，不依赖任何纹理；整片沙面沿脊线的切线
//    匀速滑移，两侧方向相反，方向在整个画面上是统一的（否则随时间会累积剪切）。
//
// 每帧只有一次全屏绘制、零次纹理采样。
precision mediump float;

uniform vec2 u_resolution;

// 颜色/光照循环相位与粒子流循环相位（都在 CPU 上取模到小范围）
uniform float u_colorTime;
// 流动已经过的秒数（持续累加）与流速（世界坐标/秒）
uniform float u_flowTime;
uniform float u_flowSpeed;
// 封面提取的四个主题色（已由 CPU 转到 OkLab），顺序为左上、右上、左下、右下
uniform vec3 u_colors[4];
// 每个封面换一次的随机偏移
uniform vec3 u_seed;
// 锋线的当前姿态：xy 为两个谐波的相位偏移，z 为整体纵向偏移。
// 换封面时由 CPU 端在若干秒内平滑插值到新的随机值，所以整屏的明暗分布
// 都会跟着缓缓移动——正因为影响的是整屏，这段过渡才必须给得足够长
uniform vec3 u_crestMotion;
uniform vec2 u_grainOffset;
uniform float u_aspect;
// x = 细颗粒强度，y = 闪粉强度，z = 金属高光强度，w = 金属化程度
uniform vec4 u_metal;
// 歌词出现时背景的收敛程度：0 为无歌词，1 为有歌词
uniform float u_lyricScrim;
// 低频强度（0–1）：随鼓点升高，背景会略微压暗
uniform float u_lowFreq;
uniform bool u_enableDithering;

const vec3 LUMA_WEIGHT = vec3(0.2126, 0.7152, 0.0722);
// 钛金属的暖中性色，去饱和时向这个色调靠拢
const vec3 TITANIUM_TINT = vec3(1.02, 1.0, 0.97);
// 闪粉的暖白高光
const vec3 HIGHLIGHT_COLOR = vec3(1.0, 0.99, 0.96);

float encodeSrgb(float channel) {
	return channel <= 0.0031308
		? 12.92 * channel
		: 1.055 * pow(max(channel, 0.0), 1.0 / 2.4) - 0.055;
}

vec3 okLabToSrgb(vec3 color) {
	float lRoot = color.x + 0.3963377774 * color.y + 0.2158037573 * color.z;
	float mRoot = color.x - 0.1055613458 * color.y - 0.0638541728 * color.z;
	float sRoot = color.x - 0.0894841775 * color.y - 1.2914855480 * color.z;
	float l = lRoot * lRoot * lRoot;
	float m = mRoot * mRoot * mRoot;
	float s = sRoot * sRoot * sRoot;
	vec3 linearColor = vec3(
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
		-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
	);
	return vec3(
		encodeSrgb(linearColor.r),
		encodeSrgb(linearColor.g),
		encodeSrgb(linearColor.b)
	);
}

float interleavedGradientNoise(vec2 position) {
	return fract(
		52.9829189 * fract(dot(position, vec2(0.06711056, 0.00583715)))
	);
}

// 一个格子的随机值：同一个格子永远得到同一组数，纯四则运算，不依赖纹理。
// 返回四路 [0,1) 的随机量，分别用于沙粒的位置、大小/亮度与是否出现。
vec4 hashGrid(vec2 cell) {
	vec4 p = fract(vec4(cell.xyxy) * vec4(0.1031, 0.1030, 0.0973, 0.1099));
	p += dot(p, p.wzxy + 33.33);
	return fract((p.xxyz + p.yzzw) * p.zywx);
}

// 一层沙粒：在 [0,1) 的格子里画出一颗圆形的沙粒。
// gate 是这一带的光照程度：1 表示亮处（几乎粒粒可见），0 表示暗处（只剩零星几点）。
// 返回 x=覆盖度（已乘权重），y=受光强度（已乘权重），z=沙粒随机亮度（已乘权重）。
const float MICRO_CELLS = 256.0;
// 格子哈希的重复周期（格）。位移按它取模即可无缝回绕，也不需要纹理
const float HASH_PERIOD = 256.0;
// 空间反光场的格数：沙粒流经其中一格时才有可能被点亮
const float GLINT_CELLS = 140.0;
// "闪粒"的占比阈值：0.95 表示只有 5% 的沙粒会明显反光（原为 0.8，即两成）
const float SPARKLE_THRESHOLD = 0.95;
// 亮面沙粒高光压暗到的比例：0.6 表示压到六成
const float BRIGHT_FACE_PARTICLE_GAIN = 0.6;
// 亮面判定的斜坡区间（按漫反射项），暗面的浮尘不参与压暗
const float BRIGHT_FACE_RAMP_START = 0.3;
const float BRIGHT_FACE_RAMP_END = 0.6;

vec4 sampleSandLayer(
	vec2 point,
	float scale,
	vec2 shift,
	vec2 flowOffset,
	vec3 surfaceNormal,
	vec3 halfDir,
	float gate
) {
	// 低频扭曲采样坐标：打散格子排列带来的宏观重复
	vec2 warped =
		point +
		0.08 *
			vec2(
				sin(point.y * 2.7 + u_seed.x * 3.0),
				cos(point.x * 2.3 + u_seed.y * 2.0)
			);
	// 基准格点：格点扰动必须基于扰动前的坐标，整片沙面才能严格周期
	vec2 base = warped * (scale * MICRO_CELLS);
	base +=
		vec2(sin(base.y * 0.11 + u_seed.x), cos(base.x * 0.09 + u_seed.y)) * 0.6;
	// 沿流动方向滑移；对哈希周期取模，滑过一整个周期画面完全一致，不会跳
	vec2 grid =
		base +
		shift +
		mod(flowOffset * (scale * MICRO_CELLS), vec2(HASH_PERIOD));
	vec2 cell = floor(grid);
	vec2 local = fract(grid);
	// 每一格只取一次随机值：位置、大小、是否出现都由它派生
	vec4 rnd = hashGrid(mod(cell, HASH_PERIOD));
	float brightness = rnd.z;
	float presentRand = rnd.w;
	float sparkleRand = fract(rnd.z * 43.1 + rnd.w * 91.7);

	// 不是每一格都有沙粒：亮处几乎粒粒可见，暗处只留下零星几点浮尘。
	// 阈值随光照移动，且留一条过渡带——沙粒是渐渐淡入淡出的，不会突然蹦出来
	float threshold = mix(0.73, 0.37, gate);
	float present = smoothstep(threshold, threshold + 0.14, presentRand);
	vec2 offset = (rnd.xy - 0.5) * 0.6;
	// 暗处的沙粒也小一些，像远处浮着的尘
	float radius = (0.3 + 0.3 * brightness) * mix(0.55, 1.0, gate);
	// 沙粒中心实、边缘柔和，免得小圆点在屏幕上被画成硬方块
	float distanceToCenter =
		length(local - 0.5 - offset) / max(radius, 1e-3);
	float mask = smoothstep(1.0, 0.5, distanceToCenter) * present;
	// 小于一个像素的沙粒按覆盖面积减暗，免得细粒凝成一个个硬方块
	float pixelsPerCell = u_resolution.y / (scale * MICRO_CELLS);
	mask *= clamp(radius * pixelsPerCell, 0.2, 1.0);
	// 每粒沙的朝向 = 沙面法线 + 一点自身倾斜 + 一点"所在位置"的倾斜。
	// 后一项让闪光取决于沙粒此刻流到了哪里：流经反光的位置时才亮，
	// 而不是每粒沙带着固定的亮度一路平移
	vec4 posRand = hashGrid(floor(point * GLINT_CELLS + shift * 97.0));
	vec3 grainNormal = normalize(
		surfaceNormal +
		vec3((rnd.xy - 0.5) * 0.8 + (posRand.xy - 0.5) * 1.4, 0.0)
	);
	// 只有约 5% 的沙粒是"闪粒"：它们朝向稍偏一点也能反光，且反得更烈；
	// 其余的只是微微发亮
	float sparkle = step(SPARKLE_THRESHOLD, sparkleRand);
	float alignment = dot(grainNormal, halfDir);
	float light = smoothstep(
		mix(0.74, 0.42, sparkle),
		mix(0.94, 0.8, sparkle),
		alignment
	);
	float glintGain = mix(0.9, 3.2, sparkle);

	return vec4(mask, light * mask * glintGain, brightness * mask, 0.0);
}

void main() {
	vec2 uv = gl_FragCoord.xy / u_resolution;
	vec2 point = vec2((uv.x - 0.5) * u_aspect, uv.y - 0.5);
	float colorPhase = u_colorTime * 6.28318530718;

	// ---- 底色：四个主题色按四角柔和混合，再叠一层很慢的扭曲 ----
	vec2 warp =
		vec2(
			sin(point.y * 1.7 + colorPhase + u_seed.x),
			cos(point.x * 1.4 - colorPhase * 2.0 + u_seed.y)
		) * 0.08;
	vec2 blended = point + warp;
	float blendX = smoothstep(-0.6, 0.6, blended.x);
	float blendY = smoothstep(-0.6, 0.6, blended.y);
	vec3 okLab = mix(
		mix(u_colors[2], u_colors[3], blendX),
		mix(u_colors[0], u_colors[1], blendX),
		blendY
	);
	vec3 base = okLabToSrgb(okLab);

	// ---- 反照率：封面本色，金属化时向中性靠拢 ----
	float luma = dot(base, LUMA_WEIGHT);
	// 一点点环境反光，避免深色封面压成纯黑
	base += TITANIUM_TINT * 0.02 * u_metal.z;
	vec3 color = mix(base, vec3(luma) * TITANIUM_TINT, u_metal.w);

	// ---- 光源缓慢绕行：明暗与闪点都随它移动 ----
	vec3 lightDir = normalize(
		vec3(0.18 + 0.3 * sin(colorPhase), 0.8, 0.55)
	);
	vec3 halfDir = normalize(lightDir + vec3(0.0, 0.0, 1.0));

	// ---- 沙面的高度场 ----
	// 脊线是一条解析曲线；脊线本身固定不动，只有粒子沿它的切线流动
	float f1 =
		point.y -
		(
			0.45 * sin(point.x * 1.6 + u_seed.x + u_crestMotion.x) +
			0.10 * sin(point.x * 3.4 + u_seed.y + u_crestMotion.y)
		) -
		u_crestMotion.z;
	float slope1 =
		-0.45 * 1.6 * cos(point.x * 1.6 + u_seed.x + u_crestMotion.x) -
		0.10 * 3.4 * cos(point.x * 3.4 + u_seed.y + u_crestMotion.y);

	// 脊线就是那条解析曲线，不再额外加扰动：几何本身完全光滑，
	// 砂砾感全部交给粉末的疏密去表现
	float crest = f1;
	// 离脊线的远近：粉末在脊线附近最浓；用高斯而不是绝对值，
	// 脊线处不会留下一道折痕
	float crestProximity = exp(-crest * crest * 6.0);

	// 圆顶的 V 形沙脊：脊线处最陡，两侧渐渐趋于平缓。
	// 脊的高度沿途起伏，沙脊有一段陡一段缓，明暗也就跟着有厚薄
	const float RIDGE_WIDTH = 0.018;
	float ridgeHeight =
		0.55 + 0.15 * sin(point.x * 1.1 + u_seed.z * 4.0);
	float ridgeSlope =
		-ridgeHeight * crest /
		sqrt(crest * crest + RIDGE_WIDTH * RIDGE_WIDTH);
	// 两层很缓的沙丘：让受光面自己也有深浅起伏
	float duneX = point.x * 1.8 + u_seed.x * 3.0;
	float duneY = point.y * 2.4 + point.x * 0.6 + u_seed.y * 5.0;
	float dhdx =
		ridgeSlope * (-slope1) +
		0.10 * 1.8 * cos(duneX) +
		0.10 * 0.6 * cos(duneY);
	float dhdy = ridgeSlope + 0.10 * 2.4 * cos(duneY);
	vec3 surfaceNormal = normalize(vec3(-dhdx, -dhdy, 1.0));

	// ---- 光照：整张沙面的明暗完全由法线与光向的点积决定 ----
	float diffuse = max(dot(surfaceNormal, lightDir), 0.0);
	// 环境光兜底：阴影里保得住封面的颜色，也再添一点天光，免得压成纯黑
	color *= 0.16 + 0.95 * diffuse;
	// 离脊线越远，底色越暗：亮面因此是一条从脊线散开的光带，
	// 而不是整块一样亮的色面（阴影侧不再额外压，免得又黑过头）
	color *= mix(1.0, mix(0.48, 1.0, crestProximity), diffuse);
	color += TITANIUM_TINT * (diffuse * 0.05 + (1.0 - diffuse) * 0.015) * u_metal.z;
	// 沙粒的密度也跟着光照走：脊线附近光足，粒粒可见；离得越远光越弱，
	// 粉末就越稀；暗面照到的光更少，只剩零星浮尘
	float lightLevel = clamp(
		diffuse * mix(0.35, 1.0, crestProximity),
		0.0,
		1.0
	);
	float grainGate = 0.1 + 0.9 * lightLevel * lightLevel;
	// 亮处也不是均匀铺开的一层：跟着封面的明暗分布略微聚散
	grainGate *= mix(0.7, 1.0, smoothstep(0.06, 0.45, luma));

	// ---- 粒子沿脊线的切线（法线的垂线）定速前进 ----
	// 方向取脊线中点的切线并固定下来：若每一点都按自己的切线方向位移，
	// 方向差会随运行时间累积成剪切，沙面最终被拉成丝。
	// 锋线姿态（u_crestMotion）刻意不参与这里：流速方向必须保持恒定，
	// 否则锋线迁移的那几秒里粒子流的走向会跟着变，同样会拉出丝来
	float centerSlope =
		-0.45 * 1.6 * cos(u_seed.x) - 0.10 * 3.4 * cos(u_seed.y);
	vec2 tangent = normalize(vec2(1.0, -centerSlope));
	// 脊线两侧朝相反方向流动：受光侧沿 +切线，背光侧沿 −切线
	float directionSign = step(0.0, f1) * 2.0 - 1.0;
	// 细粒比粗粒快一点，形成一点视差
	const float FINE_SPEED = 1.35;
	// 位移随时间持续累加，滑过纹理的一整片也不会跳变，不会出现重影。
	// 每条边上的流速必须一致：若按离脊线的远近给不同速度，相位差会随运行时间
	// 不断拉开，整片沙面最终会被剪切拉长成丝。两侧反向已经足以形成流向。
	vec2 flowOffset =
		tangent * directionSign * (u_flowTime * u_flowSpeed);
	vec2 grainPoint = point + u_grainOffset;

	// ---- 两层不同尺度的沙粒，各自沿切线匀速前进 ----
	vec4 coarse = sampleSandLayer(
		grainPoint,
		0.9,
		vec2(0.0),
		flowOffset,
		surfaceNormal,
		halfDir,
		grainGate
	);
	vec4 fine = sampleSandLayer(
		grainPoint,
		2.9,
		vec2(0.37, 0.61),
		flowOffset * FINE_SPEED,
		surfaceNormal,
		halfDir,
		grainGate
	);
	float sandMask = max(coarse.x, fine.x);
	float glint = max(coarse.y, fine.y);
	float grainBrightness =
		(coarse.z + fine.z) / max(coarse.x + fine.x, 1e-3);

	// 粉末的浓淡：脊线附近最亮，往亮面里走渐渐变暗；暗面仍留一层薄粉，
	// 不会变成一块干净的黑色
	float grainGain =
		mix(0.34, 1.0, smoothstep(0.0, 0.6, diffuse)) *
		mix(0.32, 1.0, crestProximity);
	// 有歌词时把闪点的刺眼程度收一点，白色文字压在亮处时不吃亏
	grainGain *= mix(1.0, 0.7, u_lyricScrim);

	// 亮面压暗：受光越足压得越狠，暗面那层浮尘维持原样。
	// 乘在两条粒子高光项上，避免连沙面的漫反射一起变暗
	float brightFaceGain = mix(
		1.0,
		BRIGHT_FACE_PARTICLE_GAIN,
		smoothstep(
			BRIGHT_FACE_RAMP_START,
			BRIGHT_FACE_RAMP_END,
			diffuse
		)
	);

	// 每粒沙都有一点微光，被光照中的沙粒亮得多
	color +=
		HIGHLIGHT_COLOR *
		sandMask *
		(0.015 + 0.04 * grainBrightness) *
		u_metal.x *
		grainGain *
		brightFaceGain;
	color +=
		HIGHLIGHT_COLOR *
		glint *
		(0.65 + 0.35 * grainBrightness) *
		(0.35 + 0.65 * diffuse) *
		u_metal.y *
		grainGain *
		brightFaceGain;
	color *= 1.0 + (grainBrightness - 0.5) * 0.04 * u_metal.x;

	// 有歌词时整体略收一档，并更用力地压高光：对白字的可读性影响最大的是
	// 最亮的那一部分，而不是中间调
	color *= mix(1.0, 0.86, u_lyricScrim);

	// 低频越强整屏略微压暗，和网格渐变渲染器的观感一致（粒子流速在 CPU 侧提升）
	color *= 1.0 - 0.08 * u_lowFreq;

	// HDR 式的柔和压缩，避免亮部直接死白
	color = color / (1.0 + max(color, 0.0) * (0.28 + 0.35 * u_lyricScrim));

	if (u_enableDithering) {
		float dither = interleavedGradientNoise(gl_FragCoord.xy) - 0.5;
		color += vec3(dither / 255.0);
	}

	gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}

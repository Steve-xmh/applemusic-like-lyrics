// 分数布朗运动（Fractional Brownian Motion）流体波动效果着色器
// 为了大致和 Apple Music 的背景效果一致而做了修改
// 参考自 https://www.shadertoy.com/view/tdG3Rd

precision highp float;
uniform float time; // 着色器开始运行到现在的时间，单位秒
uniform vec2 resolution; // 绘制画板的大小，单位像素
uniform sampler2D albumColorMap; // 从专辑图片中取色得出的特征色表图
uniform vec2 albumColorMapRes; // 特征色表图的分辨率，单位像素
uniform sampler2D albumImage; // 专辑图片，会被裁剪成正方形
uniform vec2 albumImageRes; // 专辑图片的大小，单位像素
// uniform float audioWaveBuffer[128]; // 当前音频的波形数据缓冲区
// uniform float audioFFTBuffer[128]; // 当前音频的可视化数据缓冲区
// uniform float renderData[16]; // 渲染管线可以随意使用的区域，用于提供自定义配置选项

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// License: WTFPL, author: sam hocevar, found: https://stackoverflow.com/a/17897228/418488
const vec4 hsv2rgb_K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
vec3 hsv2rgb(vec3 c) {
    vec3 p = abs(fract(c.xxx + hsv2rgb_K.xyz) * 6.0 - hsv2rgb_K.www);
    return c.z * mix(hsv2rgb_K.xxx, clamp(p - hsv2rgb_K.xxx, 0.0, 1.0), c.y);
}

float rand(vec2 n) {
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u * u * (3.0 - 2.0 * u);

    float res = mix(mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x), mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
    return res * res;
}

const mat2 mtx = mat2(0.80, 0.60, -0.60, 0.80);

float fbm(vec2 p) {
    float f = 0.0;

    f += 0.050000 * noise(p + time * 0.2) + time * 0.008;
    p = mtx * p * 2.02;

    f += 0.031250 * noise(p);
    p = mtx * p * 2.01;

    f += 0.250000 * noise(p);
    p = mtx * p * 2.03;

    // f += 0.125000 * noise(p);
    // p = mtx * p * 2.01;

    // f += 0.062500 * noise(p);
    // p = mtx * p * 2.04;

    // f += 0.015625 * noise(p + sin(time));

    return f / 0.96875;
}

float pattern(in vec2 p) {
    return fbm(p + fbm(p + fbm(p)));
}

void main() {
    vec2 uv = gl_FragCoord.xy / resolution.x;
    float shade = pattern(uv) / 2.;
    vec3 color = texture2D(albumColorMap, vec2(shade, shade), 16.).rgb;
    
    color = rgb2hsv(color);
    
    color.z = clamp(color.z, 0.2, 0.6);
    
    color = hsv2rgb(color);
    
    gl_FragColor = vec4(color.rgb, 1.);
}
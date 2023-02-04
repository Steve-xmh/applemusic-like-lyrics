// 高斯模糊专辑背景效果

precision highp float;
// uniform float time; // 着色器开始运行到现在的时间，单位秒
uniform vec2 resolution; // 绘制画板的大小，单位像素
// uniform sampler2D albumColorMap; // 从专辑图片中取色得出的特征色表图
// uniform vec2 albumColorMapRes; // 特征色表图的分辨率，单位像素
uniform sampler2D albumImage; // 专辑图片，会被裁剪成正方形
// uniform vec2 albumImageRes; // 专辑图片的大小，单位像素
// uniform float audioWaveBuffer[128]; // 当前音频的波形数据缓冲区
// uniform float audioFFTBuffer[128]; // 当前音频的可视化数据缓冲区
uniform float renderData[16]; // 渲染管线可以随意使用的区域，用于提供自定义配置选项

// 数字定义
#define TAU (6.28318530718) // Tau = Pi * 2

void main() {
    // 可用配置，所有选项都是越大质量越好，但是性能消耗也会更大
    float DIRECTIONS = renderData[0]; // 需要采样的扩散密度（多少个方向）
    float QUALITY = renderData[1]; // 采样精度（模糊大小 / 精度）
    float SIZE = renderData[2]; // 模糊大小（像素）
    
    vec2 r = SIZE / resolution.xy;
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 result = texture2D(albumImage, uv);

    for(float d = 0.0; d < TAU; d += TAU / DIRECTIONS) {
        for(float i = 1.0 / QUALITY; i <= 1.0; i += 1.0 / QUALITY) {
            result += texture2D(albumImage, uv + vec2(cos(d), sin(d)) * r * i);
        }
    }

    gl_FragColor = result / QUALITY * DIRECTIONS - 15.0;
}
// 高斯模糊专辑背景效果

precision highp float;
// uniform float time; // 着色器开始运行到现在的时间，单位秒
uniform vec2 resolution; // 绘制画板的大小，单位像素
// uniform sampler2D albumColorMap; // 从专辑图片中取色得出的特征色表图
// uniform vec2 albumColorMapRes; // 特征色表图的分辨率，单位像素
uniform sampler2D albumImage; // 专辑图片，会被裁剪成正方形
uniform vec2 albumImageRes; // 专辑图片的大小，单位像素
// uniform float audioWaveBuffer[128]; // 当前音频的波形数据缓冲区
// uniform float audioFFTBuffer[128]; // 当前音频的可视化数据缓冲区

// 可用配置，越大质量越好，但是性能消耗也会更大
#define SIZE (32) // 渲染大小

// 数字定义
#define TAU (6.28318530718) // Tau = Pi * 2
#define KSIZE ((SIZE - 1) / 2)

float normpdf(in float x, in float sigma) {
    return 0.39894 * exp(-0.5 * x * x / (sigma * sigma)) / sigma;
}

void main() {
    const int size = SIZE; // 模糊大小（像素）
    const int ksize = KSIZE;
    
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    
    // // TODO: 矫正大小并使其居中
    // float w = resolution.x;
    // float h = resolution.y;
    // float iw = albumImageRes.x;
    // float ih = albumImageRes.y;
    // float r = min(w / iw, h / ih);
    // float nw = iw * r;
    // float nh = ih * r;
    // float ar = 1.0;
    
    // if (nw < w) ar = w / nw;
    // if (abs(ar - 1.0) < 0.00000000000001 && nh < h) ar = h / nh;
    // nw *= ar;
    // nh *= ar;
    
    // float cw = max(0.0, iw / (nw / w));
    // float ch = max(0.0, ih / (nh / h));
    // float cx = min(iw, iw - cw);
    // float cy = min(ih, ih - ch);

    // vec2 uv = vec2(0.0, 0.0);
    // uv = gl_FragCoord.xy / resolution.xy;
    // uv.y = -uv.y;
    // uv.x -= cx / iw / 2.0;
    // uv.y -= cx * iw / ih / 2.0;
    

    float kernel[size];
    vec3 resultColor = vec3(0.0);

    float sigma = 16.0;
    float Z = 0.0;
    for(int j = 0; j <= ksize; j++) {
        kernel[ksize + j] = kernel[size - j] = normpdf(float(j), sigma);
    }

    for(int j = 0; j < size; j++) {
        Z += kernel[j];
    }

    for(int i = -ksize; i <= ksize; i++) {
        for(int j = -ksize; j <= ksize; j++) {
            resultColor += kernel[ksize + j] * kernel[ksize + i] * texture2D(albumImage, uv + vec2(float(i), float(j)) / resolution).rgb;
        }
    }

    gl_FragColor = vec4(resultColor / (Z * Z), 1.0);
}
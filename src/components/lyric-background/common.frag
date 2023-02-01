#version 300 es
precision highp float;
uniform float time; // 着色器开始运行到现在的时间，单位秒
uniform vec2 resolution; // 绘制画板的大小，单位像素
uniform sampler2D albumColorMap; // 从专辑图片中取色得出的特征色表图
uniform vec2 albumColorMapRes; // 特征色表图的分辨率，单位像素
uniform sampler2D albumImage; // 专辑图片，会被裁剪成正方形
uniform vec2 albumImageRes; // 专辑图片的大小，单位像素
uniform float audioWaveBuffer[128]; // 当前音频的波形数据缓冲区
uniform float audioFFTBuffer[128]; // 当前音频的可视化数据缓冲区
out vec4 fragColor; // 将会输出的颜色

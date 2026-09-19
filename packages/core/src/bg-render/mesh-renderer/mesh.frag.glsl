precision mediump float;

varying vec3 v_color;
varying vec2 v_uv;
uniform sampler2D u_texture;
uniform float u_volume;
uniform float u_alpha;
uniform float u_sinAngle;
uniform float u_cosAngle;
// 0 = write sRGB, 1 = write Display P3 (see bg-render/color-space.ts).
uniform int u_outputColorSpace;
// Saturation expansion applied on top of the P3 primaries, 0 disables it.
uniform float u_gamutExpand;

// 预计算常量
const float INV_255 = 1.0 / 255.0;
const float HALF_INV_255 = 0.5 / 255.0;
const float GRADIENT_NOISE_A = 52.9829189;
const vec2 GRADIENT_NOISE_B = vec2(0.06711056, 0.00583715);

float gradientNoise(in vec2 uv) {
    return fract(GRADIENT_NOISE_A * fract(dot(uv, GRADIENT_NOISE_B)));
}

// sRGB / Display P3 share the same transfer function, so one decode and one
// encode cover both output spaces; only the primaries differ.
float decodeTransfer(in float channel) {
    return channel <= 0.04045
        ? channel / 12.92
        : pow((channel + 0.055) / 1.055, 2.4);
}

float encodeTransfer(in float channel) {
    return channel <= 0.0031308
        ? 12.92 * channel
        : 1.055 * pow(max(channel, 0.0), 1.0 / 2.4) - 0.055;
}

// linear-light sRGB -> linear-light Display P3 (CSS Color 4 lin_sRGB_to_lin_P3).
vec3 linearSrgbToLinearP3(in vec3 color) {
    return vec3(
        dot(color, vec3(0.8224621724082974, 0.033194198850959854, 0.017082630775268638)),
        dot(color, vec3(0.1775378275917017, 0.9668058011490399, 0.07239743980023199)),
        dot(color, vec3(0.0, 0.0, 0.9105199294244997))
    );
}

// 把已经算好的 sRGB 编码值换到绘制缓冲的色彩空间。
//
// 只换基色的话观感与原来完全一致 —— sRGB 整个都装得进 P3，多出来的那圈色域
// 白空着。所以在这里再绕亮度扩张一次，把这圈色域真正用上；本渲染器在 CPU 侧
// 就对封面做过大幅度的饱和度提升，那些被 8 位 sRGB 削平的颜色因此能重新展开。
vec3 encodeSrgbToDisplayP3(in vec3 encoded, in float expand) {
    vec3 linear = linearSrgbToLinearP3(vec3(
        decodeTransfer(encoded.r),
        decodeTransfer(encoded.g),
        decodeTransfer(encoded.b)
    ));
    float luma = dot(linear, vec3(0.2289745641, 0.6917385218, 0.0792869141));
    linear = clamp(mix(vec3(luma), linear, 1.0 + expand), 0.0, 1.0);
    return vec3(
        encodeTransfer(linear.r),
        encodeTransfer(linear.g),
        encodeTransfer(linear.b)
    );
}

void main() {
    float volumeEffect = u_volume * 2.0;

    float dither = INV_255 * gradientNoise(gl_FragCoord.xy) - HALF_INV_255;

    vec2 centeredUV = v_uv - vec2(0.2);

    vec2 rotatedUV = vec2(
        u_cosAngle * centeredUV.x - u_sinAngle * centeredUV.y,
        u_sinAngle * centeredUV.x + u_cosAngle * centeredUV.y
    );

    vec2 finalUV = rotatedUV * max(0.001, 1.0 - volumeEffect) + vec2(0.5);
    
    vec4 result = texture2D(u_texture, finalUV);
    
    float alphaVolumeFactor = u_alpha * max(0.5, 1.0 - u_volume * 0.5);
    result.rgb *= v_color * alphaVolumeFactor;
    result.a *= alphaVolumeFactor;
    
    result.rgb += vec3(dither);
    
    float dist = distance(v_uv, vec2(0.5));
    float vignette = smoothstep(0.8, 0.3, dist);
    float mask = 0.6 + vignette * 0.4;
    result.rgb *= mask;

    // sRGB 分支一个字节都不会变，保证 SDR 设备上的画面与以前完全一致
    if (u_outputColorSpace == 1) {
        result.rgb = encodeSrgbToDisplayP3(result.rgb, u_gamutExpand);
    }

    gl_FragColor = result;
}

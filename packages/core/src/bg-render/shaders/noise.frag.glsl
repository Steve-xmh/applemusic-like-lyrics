#version 300 es
precision highp float;

uniform sampler2D src;
in vec2 f_v_coord;
out vec4 fragColor;

/* Gradient noise from Jorge Jimenez's presentation: */
/* http://www.iryoku.com/next-generation-post-processing-in-call-of-duty-advanced-warfare */
float gradientNoise(in vec2 uv) {
    return fract(52.9829189f * fract(dot(uv, vec2(0.06711056f, 0.00583715f))));
}

void main() {
    vec2 tex_coord = f_v_coord;
    float dither = (1.0f / 255.0f) * gradientNoise(gl_FragCoord.xy) - (0.5f / 255.0f);
    vec4 color = texture(src, tex_coord);
    color += dither;
    fragColor = color;
}

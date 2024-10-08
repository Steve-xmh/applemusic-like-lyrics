precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_texture_res;

// 来自 https://www.shadertoy.com/view/MfV3RW
vec4 kawaseBlur(sampler2D tex, vec2 fragCoord, vec2 res, float d) {
    vec2 s0 = (fragCoord + vec2(d, d)) / res;
    vec2 s1 = (fragCoord + vec2(d, -d)) / res;
    vec2 s2 = (fragCoord + vec2(-d, d)) / res;
    vec2 s3 = (fragCoord + vec2(-d, -d)) / res;

    d *= 2.0;

    vec2 s4 = (fragCoord + vec2(d, d)) / res;
    vec2 s5 = (fragCoord + vec2(d, -d)) / res;
    vec2 s6 = (fragCoord + vec2(-d, d)) / res;
    vec2 s7 = (fragCoord + vec2(-d, -d)) / res;

    float lod = 1.0;
    return (texture2D(tex, s0, lod) +
        texture2D(tex, s1, lod) +
        texture2D(tex, s2, lod) +
        texture2D(tex, s3, lod) +
        texture2D(tex, s4, lod) +
        texture2D(tex, s5, lod) +
        texture2D(tex, s6, lod) +
        texture2D(tex, s7, lod)) / 8.0;
}

void main() {
    gl_FragColor = kawaseBlur(u_texture, gl_FragCoord.xy, u_texture_res, 0.5);
}
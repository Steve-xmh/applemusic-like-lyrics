#version 300 es
precision highp float;

uniform sampler2D src;
uniform float lerp;
in vec2 f_v_coord;
out vec4 fragColor;

void main() {
    vec4 srcColor = texture(src, f_v_coord);
    fragColor = mix(vec4(srcColor.xyz, 0.0), srcColor, lerp);
}

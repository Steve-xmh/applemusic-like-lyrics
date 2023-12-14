#version 300 es
precision highp float;

uniform sampler2D src;
uniform sampler2D dest;
uniform float lerp;
in vec2 f_v_coord;
out vec4 fragColor;

void main() {
    vec4 srcColor = texture(src, f_v_coord);
    vec4 destColor = texture(dest, f_v_coord);
    fragColor = mix(srcColor, destColor, lerp);
}

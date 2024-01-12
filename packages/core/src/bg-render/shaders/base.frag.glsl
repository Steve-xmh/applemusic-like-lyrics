#version 300 es
precision highp float;

uniform sampler2D src;
in vec2 f_v_coord;
out vec4 fragColor;

void main() {
    vec2 coord = f_v_coord;
    fragColor = texture(src, coord);
}

#version 300 es
precision highp float;

in vec2 v_coord;
out vec2 f_v_coord;

void main() {
    gl_Position = vec4(v_coord, 0.0f, 1.0f);
    f_v_coord = (vec2(v_coord.x, v_coord.y) + vec2(1.0f, 1.0f)) / 2.0f;
}
